# T-03 — Refatorar `AuthCallbackPage` para event-driven com `onAuthStateChange`

**Status:** ✅ Implementado (abordagem evoluiu)  
**Arquivo:** `apps/admin/src/pages/AuthCallbackPage.tsx`  
**Spec ref:** BUG-03 (P1 Médio)

---

## Problema original

`AuthCallbackPage` usava `setTimeout(500)` para aguardar o Supabase processar o callback — abordagem frágil e sujeita a race condition em conexões lentas. Além disso, `setIsDone(true)` estava duplicado em `try` e `catch` (sem `finally`), e `Boolean()` era usado desnecessariamente.

---

## Abordagem original (descartada)

Remover `ensureProfileExists` do callback e deixar o `AuthProvider` cuidar do perfil via `subscribeAuthChanges`.

## Abordagem final (implementada)

Com `detectSessionInUrl: true` (T-01), o SDK troca o código automaticamente e dispara `SIGNED_IN` quando a sessão está pronta. O `AuthCallbackPage` foi reescrito para reagir a esse evento via `onAuthStateChange` — timing determinístico, sem polling e sem delay arbitrário.

`ensureProfileExists` permanece no callback (chamada no handler), evitando dependência de timing do `AuthProvider`.

---

## Diff

```diff
  import { useEffect, useState } from 'react'
  import { Navigate } from 'react-router-dom'
- import { getSession, ensureProfileExists } from '@/services/auth/auth.service'
+ import { supabase } from '@/lib/supabase'
+ import { ensureProfileExists } from '@/services/auth/auth.service'
  
  export function AuthCallbackPage() {
    const [error, setError] = useState<string | null>(null)
    const [isDone, setIsDone] = useState(false)
-   const isDatabaseSignupError = Boolean(error?.includes('Database error saving new user'))
+   const isDatabaseSignupError = error?.includes('Database error saving new user') ?? false
  
    useEffect(() => {
-     const checkSession = async () => {
-       try {
-         const session = await getSession()
-         if (session?.user?.id) {
-           await ensureProfileExists(session.user.id)
-         }
-         setIsDone(true)
-       } catch (err) {
-         setError(err instanceof Error ? err.message : 'Erro ao processar login.')
-         console.error('Callback error:', err)
-         setIsDone(true)
-       }
-     }
-     const timer = setTimeout(checkSession, 500)
-     return () => clearTimeout(timer)
+     const urlParams = new URLSearchParams(globalThis.location.search)
+     const errorParam = urlParams.get('error')
+
+     if (errorParam) {
+       const errorDescription = urlParams.get('error_description') ?? ''
+       setError(`Erro OAuth: ${errorParam}. ${errorDescription}`)
+       setIsDone(true)
+       return
+     }
+
+     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
+       if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return
+       try {
+         if (session?.user?.id) {
+           await ensureProfileExists(session.user.id)
+         }
+       } catch (err) {
+         setError(err instanceof Error ? err.message : 'Erro ao processar login.')
+         console.error('Callback error:', err)
+       } finally {
+         setIsDone(true)
+       }
+     })
+     return () => subscription.unsubscribe()
    }, [])
```

---

## Responsabilidade pós-correção

| Responsabilidade                        | Quem faz                                          |
|-----------------------------------------|---------------------------------------------------|
| Trocar o código OAuth por sessão        | SDK Supabase (via `detectSessionInUrl: true`)     |
| Aguardar sessão ficar pronta            | `onAuthStateChange` em `AuthCallbackPage`         |
| Criar/garantir perfil após login        | `ensureProfileExists` em `AuthCallbackPage`       |
| Criar perfil + tenant no primeiro login | trigger `handle_new_auth_user` (banco)            |
| Redirecionar para `/admin`              | `AuthCallbackPage` (`<Navigate>`)                 |

---

## Gate

- [x] `tsc --noEmit` — zero erros
- [x] Sem `setTimeout` — timing via evento Supabase
- [x] Erros de URL tratados diretamente, antes do listener
- [x] `finally` garante `setIsDone(true)` em todos os caminhos
- [x] `Boolean()` redundante removido

---

## Commit sugerido

```
fix(auth): substituir setTimeout por onAuthStateChange no AuthCallbackPage

Timing baseado em 500ms fixos era frágil. onAuthStateChange reage ao
SIGNED_IN emitido pelo SDK após detectSessionInUrl trocar o código PKCE,
garantindo comportamento determinístico em qualquer velocidade de rede.
```

---

## Problema

Após a troca do código OAuth (`exchangeCodeForSession`), o Supabase SDK dispara internamente o evento `SIGNED_IN`. O `AuthProvider` está inscrito nesse evento via `subscribeAuthChanges` e chama `loadProfile → resolveProfile → ensureProfileExists` automaticamente.

O `AuthCallbackPage` também chamava `ensureProfileExists` explicitamente, resultando em duas chamadas paralelas ao banco:

```
exchangeCodeForSession()
  ├─ dispara SIGNED_IN
  │    └─ AuthProvider.subscribeAuthChanges
  │         └─ loadProfile → ensureProfileExists  ← chamada #1
  └─ retorna ao AuthCallbackPage
       └─ ensureProfileExists(session.user.id)    ← chamada #2 (redundante)
```

Para novos usuários, se ambas as chamadas chegassem ao `catch` de `getProfileByUserId` ao mesmo tempo (perfil ainda não confirmado no banco), a segunda chamada a `bootstrap_profile` levantava `PERFIL_JA_EXISTE`, gerando erro visível ao usuário de forma intermitente.

---

## Diff

```diff
  import { useEffect, useState } from 'react'
  import { Navigate } from 'react-router-dom'
- import { exchangeCodeForSession, getSession, ensureProfileExists } from '@/services/auth/auth.service'
+ import { exchangeCodeForSession } from '@/services/auth/auth.service'
  
  export function AuthCallbackPage() {
    const [error, setError] = useState<string | null>(null)
    const [isDone, setIsDone] = useState(false)
  
    useEffect(() => {
      void (async () => {
        try {
          await exchangeCodeForSession()
-         const session = await getSession()
-         if (session?.user?.id) {
-           await ensureProfileExists(session.user.id)
-         }
        } catch (callbackError) {
```

---

## Resultado final

```ts
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { exchangeCodeForSession } from '@/services/auth/auth.service'

export function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        await exchangeCodeForSession()
      } catch (callbackError) {
        const message = callbackError instanceof Error ? callbackError.message : 'Erro no callback OAuth.'
        setError(message)
        console.error('Callback error:', callbackError)
        console.error('Current URL:', globalThis.location.href)
      } finally {
        setIsDone(true)
      }
    })()
  }, [])

  // ...restante do JSX sem alteração
}
```

---

## Responsabilidade pós-correção

| Responsabilidade                        | Quem faz              |
|-----------------------------------------|-----------------------|
| Trocar o código OAuth por sessão        | `AuthCallbackPage`    |
| Carregar/criar perfil após login        | `AuthProvider` (via `subscribeAuthChanges → loadProfile`) |
| Criar perfil + tenant no primeiro login | trigger `handle_new_auth_user` (banco) |
| Redirecionar para `/admin`              | `AuthCallbackPage` (`<Navigate>`) |

---

## Gate

- [x] `tsc --noEmit` — zero erros
- [x] Imports de `getSession` e `ensureProfileExists` removidos — sem dead code
- [x] `useEffect` chama apenas `exchangeCodeForSession()`

---

## Commit sugerido

```
fix(auth): remover ensureProfileExists redundante do AuthCallbackPage

AuthProvider já carrega o perfil via subscribeAuthChanges após SIGNED_IN.
A chamada dupla causava PERFIL_JA_EXISTE intermitente em novos usuários.
```
