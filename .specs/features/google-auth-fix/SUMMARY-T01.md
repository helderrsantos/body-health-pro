# T-01 — Delegar troca de código PKCE ao SDK via `detectSessionInUrl`

**Status:** ✅ Implementado (abordagem evoluíu)  
**Arquivos:** `apps/admin/src/lib/supabase.ts`, `apps/admin/src/services/auth/auth.service.ts`  
**Spec ref:** BUG-01 (P0 Crítico)

---

## Problema

No fluxo PKCE do Supabase, após o Google redirecionar o usuário de volta, a URL contém `?code=<authorization_code>`. Esse código precisa ser trocado por uma sessão. O código anterior chamava `supabase.auth.getSession()`, que apenas lê a sessão armazenada em memória — sempre `null` nesse momento. O login com Google nunca estabelecia sessão.

---

## Abordagem original (descartada)

Corrigir `exchangeCodeForSession` para extrair o `code` da URL e chamar `supabase.auth.exchangeCodeForSession(code)` explicitamente.

## Abordagem final (implementada)

Adicionado `detectSessionInUrl: true` ao cliente Supabase. Com essa flag, o SDK detecta o `?code=` na URL durante a inicialização e executa a troca PKCE internamente, sem intervenção manual. A função `exchangeCodeForSession` em `auth.service.ts` ficou sem chamadores e foi **removida**.

---

## Diff

### `supabase.ts`

```diff
  export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: 'pkce',
+     detectSessionInUrl: true,
    },
  })
```

### `auth.service.ts`

```diff
- export async function exchangeCodeForSession() {
-   const urlParams = new URL(globalThis.location.href).searchParams
-   const errorParam = urlParams.get('error')
-   const errorDescription = urlParams.get('error_description')
-
-   if (errorParam) { ... }
-
-   const code = urlParams.get('code')
-   if (!code) { throw new Error(...) }
-
-   const { error } = await supabase.auth.exchangeCodeForSession(code)
-   if (error) { throw new Error(error.message) }
- }
```

---

## Gate

- [x] `tsc --noEmit` — zero erros
- [x] `detectSessionInUrl: true` presente no cliente
- [x] `exchangeCodeForSession` removida — sem dead code

---

## Commit sugerido

```
fix(auth): delegar troca PKCE ao SDK e remover exchangeCodeForSession

Adicionado detectSessionInUrl: true ao cliente Supabase. O SDK passa
a detectar e trocar o ?code= automaticamente na inicialização,
eliminando a necessidade da função exchangeCodeForSession manual.
```

---

## Problema

No fluxo PKCE do Supabase, após o Google redirecionar o usuário de volta, a URL contém `?code=<authorization_code>`. Esse código precisa ser trocado por uma sessão via `supabase.auth.exchangeCodeForSession(code)`. O código anterior chamava `supabase.auth.getSession()`, que apenas lê a sessão armazenada em memória — sempre `null` nesse momento. O login com Google nunca estabelecia sessão.

---

## Diff

```diff
  export async function exchangeCodeForSession() {
    const urlParams = new URL(globalThis.location.href).searchParams
    const errorParam = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
  
    if (errorParam) {
      throw new Error(`Erro OAuth: ${errorParam}. ${errorDescription || ''}`)
    }
  
-   // Deixar o Supabase processar automaticamente o PKCE flow
-   // O code_verifier e code já estão no localStorage/URL
-   const { data, error } = await supabase.auth.getSession()
-
-   if (error) {
-     throw new Error(error.message)
-   }
-
-   if (!data.session) {
-     throw new Error('Nenhuma sessão ativa encontrada. Tente fazer login novamente.')
-   }
+   const code = urlParams.get('code')
+
+   if (!code) {
+     throw new Error('Código de autorização não encontrado na URL. Tente fazer login novamente.')
+   }
+
+   const { error } = await supabase.auth.exchangeCodeForSession(code)
+
+   if (error) {
+     throw new Error(error.message)
+   }
  }
```

---

## Resultado final

```ts
export async function exchangeCodeForSession() {
  const urlParams = new URL(globalThis.location.href).searchParams
  const errorParam = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')

  if (errorParam) {
    throw new Error(`Erro OAuth: ${errorParam}. ${errorDescription || ''}`)
  }

  const code = urlParams.get('code')

  if (!code) {
    throw new Error('Código de autorização não encontrado na URL. Tente fazer login novamente.')
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw new Error(error.message)
  }
}
```

---

## Gate

- [x] `tsc --noEmit` — zero erros
- [x] Verificação de `?error` na URL preservada (erros OAuth do Google continuam visíveis)
- [x] Lança erro claro quando `code` está ausente na URL
- [x] Usa `supabase.auth.exchangeCodeForSession(code)` — método correto para PKCE

---

## Commit sugerido

```
fix(auth): corrigir troca de código PKCE no Google OAuth

exchangeCodeForSession chamava getSession() que retorna null antes
da troca do código. Agora extrai o code da URL e chama
supabase.auth.exchangeCodeForSession(code) conforme PKCE exige.
```
