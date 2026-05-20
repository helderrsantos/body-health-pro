# Design: Correção da Autenticação Google

**Feature:** `google-auth-fix`  
**Baseado em:** spec.md (BUG-01, BUG-02, BUG-03)

---

## 1. Fluxo atual (quebrado)

```
LoginPage
  └─ handleGoogleSignIn()
       └─ signInWithGoogle()
            └─ supabase.auth.signInWithOAuth({ redirectTo: "https://...vercel.app/auth/callback" })
                  ↓ Google OAuth
            Google → https://...vercel.app/auth/callback?code=<CODE>
                  ↓
AuthCallbackPage (useEffect)
  ├─ exchangeCodeForSession()           ← BUG-01: chama getSession() NÃO exchangeCodeForSession(code)
  │    └─ supabase.auth.getSession()    ← retorna null (código ainda não foi trocado)
  │    └─ lança "Nenhuma sessão ativa"  ← ❌ falha aqui
  └─ [nunca chega aqui]
```

---

## 2. Fluxo corrigido

```
LoginPage
  └─ handleGoogleSignIn()
       └─ signInWithGoogle()
            └─ supabase.auth.signInWithOAuth({
                 provider: 'google',
                 redirectTo: `${location.origin}/auth/callback`  ← BUG-02 fix: dinâmico
               })
                  ↓ Google OAuth (PKCE: code_challenge gerado e salvo em localStorage)
            Google → /auth/callback?code=<CODE>
                  ↓
AuthCallbackPage (useEffect)
  ├─ exchangeCodeForSession()
  │    ├─ lê code da URL
  │    └─ supabase.auth.exchangeCodeForSession(code)  ← BUG-01 fix
  │         ├─ troca code por session
  │         ├─ salva session em localStorage
  │         └─ dispara SIGNED_IN → AuthProvider.subscribeAuthChanges
  │              └─ loadProfile → resolveProfile → ensureProfileExists  ← único chamador
  └─ isDone = true → <Navigate to="/admin" />          ← BUG-03 fix: sem ensureProfileExists aqui
```

---

## 3. Componentes afetados

### `auth.service.ts` — 2 mudanças

**`signInWithGoogle`**: substituir `redirectTo` hardcoded por `location.origin`.

```ts
// antes
redirectTo: 'https://body-health-pro-admin.vercel.app/auth/callback'

// depois
redirectTo: `${globalThis.location.origin}/auth/callback`
```

**`exchangeCodeForSession`**: extrair o `code` da URL e chamar `exchangeCodeForSession(code)`.

```ts
// antes
const { data, error } = await supabase.auth.getSession()
if (!data.session) throw new Error('Nenhuma sessão ativa encontrada...')

// depois
const code = urlParams.get('code')
if (!code) throw new Error('Código de autorização não encontrado na URL.')
const { error } = await supabase.auth.exchangeCodeForSession(code)
```

---

### `AuthCallbackPage.tsx` — 1 mudança

Remover as chamadas a `getSession` e `ensureProfileExists`. O callback deve apenas:
1. Trocar o código
2. Aguardar (`isDone`)
3. Redirecionar para `/admin`

O `AuthProvider` cuida do carregamento do perfil via `subscribeAuthChanges → loadProfile`.

```ts
// antes
await exchangeCodeForSession()
const session = await getSession()
if (session?.user?.id) {
  await ensureProfileExists(session.user.id)
}

// depois
await exchangeCodeForSession()
// AuthProvider.subscribeAuthChanges cuida do perfil
```

**Imports:** remover `getSession` e `ensureProfileExists` do import.

---

## 4. Invariantes preservadas

| Invariante | Como é mantida |
|------------|----------------|
| `ensureProfileExists` ainda é chamado para novos usuários | Via `AuthProvider.subscribeAuthChanges` disparado pelo `SIGNED_IN` após a troca do código |
| PKCE flow intacto | `supabase.ts` mantém `flowType: 'pkce'`; `exchangeCodeForSession(code)` é compatível |
| Erro OAuth visível ao usuário | `exchangeCodeForSession` ainda checa `?error` na URL antes de tentar trocar o código |
| Funciona em localhost | `location.origin` resolve para `http://localhost:5173` em dev |
| Funciona em produção | `location.origin` resolve para `https://body-health-pro-admin.vercel.app` em prod |

---

## 5. Não requer mudanças

- `supabase.ts` — `flowType: 'pkce'` está correto
- `useAuth.tsx` — lógica do `AuthProvider` já está correta
- `handle_new_auth_user` trigger — já cria perfil + tenant automaticamente
- SQL / RLS — sem impacto
