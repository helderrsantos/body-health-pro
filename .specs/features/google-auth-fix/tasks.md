# Tasks: Correção da Autenticação Google

**Feature:** `google-auth-fix`  
**Escopo:** 3 arquivos, 3 bugs críticos/médios  
**Dependência de referência:** spec.md, design.md

---

## Sumário de tasks

| ID     | Título                                          | Arquivos                                    | Prioridade | Status |
|--------|-------------------------------------------------|---------------------------------------------|------------|--------|
| T-01   | ~~Corrigir `exchangeCodeForSession`~~           | `auth.service.ts`, `supabase.ts`            | P0         | ✅ done |
| T-02   | Corrigir `redirectTo` hardcoded                 | `auth.service.ts`                           | P0         | ✅ done |
| T-03   | Refatorar `AuthCallbackPage` para event-driven  | `AuthCallbackPage.tsx`                      | P1         | ✅ done |

> **Nota (revisão pós-implementação):** A abordagem de T-01 e T-03 evoluiu durante a implementação. Ver seções abaixo e summaries para o racional completo.

> T-01 e T-02 estão no mesmo arquivo e devem ser feitos no mesmo commit.  
> T-03 é independente mas deve vir depois de T-01/T-02 validados.

---

## T-01 — ~~Corrigir `exchangeCodeForSession`~~ → Delegado ao SDK via `detectSessionInUrl` [P0 — CRÍTICO]

**Spec ref:** BUG-01  
**Arquivos:** `apps/admin/src/lib/supabase.ts`, `apps/admin/src/services/auth/auth.service.ts`

### Abordagem original (descartada)

A intenção inicial era corrigir a função `exchangeCodeForSession` para chamar `supabase.auth.exchangeCodeForSession(code)` explicitamente.

### Abordagem final (implementada)

Adicionado `detectSessionInUrl: true` ao cliente Supabase. Com essa flag, o SDK detecta o `?code=` na URL automaticamente durante a inicialização e executa a troca PKCE internamente — sem necessidade de chamada manual.

Como consequência, a função `exchangeCodeForSession` em `auth.service.ts` ficou sem chamadores e foi **removida** inteiramente.

```ts
// supabase.ts — mudança adicionada
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true, // ← SDK troca o código automaticamente
  },
})
```

### Feito quando

- [x] `detectSessionInUrl: true` presente em `supabase.ts`
- [x] `exchangeCodeForSession` removida de `auth.service.ts`
- [x] TypeScript sem erros (`tsc --noEmit`)

### Gate

```bash
cd apps/admin && npx tsc --noEmit
```

---

## T-02 — Corrigir `redirectTo` hardcoded [P0 — ALTO]

**Spec ref:** BUG-02  
**Arquivo:** `apps/admin/src/services/auth/auth.service.ts`  
**Pode ser feito no mesmo commit que T-01**

### O que mudar

Em `signInWithGoogle`:

```ts
// ❌ Remove
redirectTo: 'https://body-health-pro-admin.vercel.app/auth/callback'

// ✅ Substitui por
redirectTo: `${globalThis.location.origin}/auth/callback`
```

### Feito quando

- [ ] `redirectTo` usa `globalThis.location.origin` (funciona em browser e testes)
- [ ] URL de callback fica `<origin>/auth/callback` em qualquer ambiente
- [ ] TypeScript sem erros

### Gate

```bash
cd apps/admin && npx tsc --noEmit
```

---

## T-03 — Refatorar `AuthCallbackPage` para event-driven com `onAuthStateChange` [P1 — MÉDIO]

**Spec ref:** BUG-03  
**Arquivo:** `apps/admin/src/pages/AuthCallbackPage.tsx`  
**Depende de:** T-01, T-02

### Abordagem original (descartada)

Remover `ensureProfileExists` do callback e deixar o `AuthProvider` cuidar do perfil.

### Abordagem final (implementada)

Com `detectSessionInUrl: true` (T-01), não há mais uma função `exchangeCodeForSession` para chamar. O SDK processa o código internamente e dispara `SIGNED_IN` quando a sessão está pronta.

O `AuthCallbackPage` foi reescrito para:
1. Verificar `?error=` na URL imediatamente (sem esperar o SDK)
2. Registrar `onAuthStateChange` para aguardar `SIGNED_IN | INITIAL_SESSION`
3. Chamar `ensureProfileExists` no handler (evita race condition com AuthProvider)
4. Usar `finally` para garantir `setIsDone(true)` em qualquer caminho

```ts
// ✅ Resultado final
const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
  if (event !== 'SIGNED_IN' && event !== 'INITIAL_SESSION') return
  try {
    if (session?.user?.id) {
      await ensureProfileExists(session.user.id)
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Erro ao processar login.')
  } finally {
    setIsDone(true)
  }
})
return () => subscription.unsubscribe()
```

### Feito quando

- [x] Sem `setTimeout` — timing determinístico via evento
- [x] Erros de URL tratados antes do listener
- [x] `finally` garante `setIsDone(true)` em todos os caminhos
- [x] `Boolean()` redundante removido
- [x] TypeScript sem erros

### Gate

```bash
cd apps/admin && npx tsc --noEmit
```

---

## Commit strategy

```
T-01 + T-02 → commit: fix(auth): corrigir troca de código PKCE e redirectTo dinâmico no Google OAuth
T-03        → commit: fix(auth): remover ensureProfileExists redundante do AuthCallbackPage
```

---

## Verificação manual (AC da spec)

Após implementar as 3 tasks, validar manualmente:

1. **AC-01** — Abrir `localhost:5173`, clicar "Continuar com Google" com conta existente → chega em `/admin` autenticado
2. **AC-02** — Repetir com conta nova → perfil criado pelo trigger → chega em `/admin`
3. **AC-03** — Confirmar que o redirect voltou para `localhost` (não para produção)
4. **AC-04** — Cancelar o login no Google → página `/auth/callback` exibe erro claro
5. **AC-05** — Sem erros de console relacionados a `PERFIL_JA_EXISTE` ou double fetch

---

## Ideias deferidas (não neste ciclo)

- **BUG-04:** Novos usuários Google recebem tenant genérico (`Tenant a1b2c3d4`). Avaliar onboarding de nome da organização na Fase 3.
- **BUG-05:** `AuthCallbackPage` erro UI com inline styles — migrar para Tailwind no próximo ciclo de polish.
