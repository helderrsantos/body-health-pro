# T-02 — Corrigir `redirectTo` hardcoded no Google OAuth

**Status:** ✅ Implementado  
**Arquivo:** `apps/admin/src/services/auth/auth.service.ts`  
**Spec ref:** BUG-02 (P0 Alto)

---

## Problema

A URL de retorno do OAuth estava fixada em `https://body-health-pro-admin.vercel.app/auth/callback`. Qualquer ambiente fora de produção (localhost, staging, preview deploys) nunca recebia o callback do Google — o usuário era redirecionado para o domínio de produção independentemente de onde estava.

---

## Diff

```diff
  export async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
-       redirectTo: 'https://body-health-pro-admin.vercel.app/auth/callback',
+       redirectTo: `${globalThis.location.origin}/auth/callback`,
      },
    })
  
    if (error) {
      throw new Error(error.message)
    }
  }
```

---

## Resultado final

```ts
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${globalThis.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}
```

---

## Como funciona por ambiente

| Ambiente        | `location.origin`                                  | `redirectTo` resultante                                          |
|-----------------|----------------------------------------------------|------------------------------------------------------------------|
| localhost       | `http://localhost:5173`                            | `http://localhost:5173/auth/callback`                            |
| Produção        | `https://body-health-pro-admin.vercel.app`         | `https://body-health-pro-admin.vercel.app/auth/callback`         |
| Preview Vercel  | `https://body-health-pro-admin-git-feat-xyz.vercel.app` | `https://body-health-pro-admin-git-feat-xyz.vercel.app/auth/callback` |

> **Pré-requisito no Supabase:** os domínios de callback precisam estar cadastrados em  
> Authentication → URL Configuration → Redirect URLs.  
> Adicionar `http://localhost:5173/auth/callback` para desenvolvimento local.

---

## Gate

- [x] `tsc --noEmit` — zero erros
- [x] `globalThis.location.origin` funciona em browser e em contextos SSR/test (não depende de `window`)

---

## Commit sugerido

```
fix(auth): tornar redirectTo do Google OAuth dinâmico por ambiente

URL de callback estava hardcoded para produção. Agora usa
location.origin para funcionar em localhost e qualquer ambiente.
```
