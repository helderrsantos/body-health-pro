# Spec: Correção da Autenticação Google (OAuth PKCE)

**Feature ID:** `google-auth-fix`  
**Escopo:** Large — múltiplos bugs na camada de auth, race condition, URL hardcoded  
**Prioridade:** P0 — login com Google está completamente quebrado em produção  
**Requisitos relacionados:** RF-01 (Autenticação e sessão), RNF-01 (Segurança)

---

## 1. Contexto e diagnóstico

O fluxo de login com Google usa o provider OAuth do Supabase com `flowType: 'pkce'`. No PKCE, após o Google redirecionar o usuário de volta para `/auth/callback`, a URL contém `?code=<authorization_code>`. O SDK do Supabase **não** troca esse código automaticamente — é necessário chamar `supabase.auth.exchangeCodeForSession(code)` explicitamente.

O código atual **chama `getSession()` no lugar**, que simplesmente lê a sessão armazenada em memória/localStorage — sempre `null` nesse momento, pois a troca ainda não ocorreu. Resultado: o login com Google **nunca produz sessão** e o usuário é redirecionado ao `/admin` sem estar autenticado (ou falha com "Nenhuma sessão ativa encontrada").

---

## 2. Bugs identificados

### BUG-01 — `exchangeCodeForSession` usa `getSession()` ao invés de trocar o código [CRÍTICO]

**Arquivo:** `apps/admin/src/services/auth/auth.service.ts`  
**Causa raiz:** A função chama `supabase.auth.getSession()` em vez de `supabase.auth.exchangeCodeForSession(code)` com o `code` extraído da URL.  
**Impacto:** Login com Google nunca estabelece sessão. Bloqueante total.

```ts
// ❌ Atual — não troca o código
const { data, error } = await supabase.auth.getSession()

// ✅ Correto — extrai o código da URL e troca pela sessão
const code = new URL(globalThis.location.href).searchParams.get('code')
if (!code) throw new Error('Código de autorização não encontrado na URL.')
const { error } = await supabase.auth.exchangeCodeForSession(code)
```

---

### BUG-02 — `redirectTo` hardcoded para produção [ALTO]

**Arquivo:** `apps/admin/src/services/auth/auth.service.ts`  
**Causa raiz:** `redirectTo` está fixo como `'https://body-health-pro-admin.vercel.app/auth/callback'`.  
**Impacto:** Login com Google nunca funciona em localhost. Qualquer ambiente não-produção é bloqueado.

```ts
// ❌ Atual
redirectTo: 'https://body-health-pro-admin.vercel.app/auth/callback'

// ✅ Correto — dinâmico, baseado no ambiente atual
redirectTo: `${globalThis.location.origin}/auth/callback`
```

---

### BUG-03 — Race condition: `ensureProfileExists` chamado duas vezes simultaneamente [MÉDIO]

**Arquivos:** `apps/admin/src/pages/AuthCallbackPage.tsx` + `apps/admin/src/hooks/useAuth.tsx`  
**Causa raiz:**  
1. `AuthCallbackPage` chama `ensureProfileExists` explicitamente após a troca do código.  
2. `supabase.auth.exchangeCodeForSession(code)` dispara `SIGNED_IN` internamente.  
3. `AuthProvider.subscribeAuthChanges` captura o evento `SIGNED_IN` e chama `loadProfile → resolveProfile → ensureProfileExists`.  
4. Duas chamadas paralelas chegam ao banco. Para usuários com perfil já existente (criado pelo trigger `handle_new_auth_user`), ambas leem o mesmo perfil — sem dano. Mas se o perfil ainda não estiver confirmado no banco no momento da leitura (race com o trigger), a primeira chamada pode falhar `getProfileByUserId` e invocar `bootstrap_profile`, que levanta `PERFIL_JA_EXISTE` da segunda chamada — gerando erro visível ao usuário.

**Impacto:** Falha intermitente no primeiro login de novos usuários Google.

**Fix:** Remover a chamada explícita de `ensureProfileExists` no `AuthCallbackPage`. O `AuthProvider` já cuida disso via `subscribeAuthChanges`. O callback deve apenas trocar o código e aguardar o redirecionamento.

---

### BUG-04 — Novo usuário Google recebe nome de tenant genérico [BAIXO / UX]

**Arquivos:** `packages/database/sql/phase1_auth_roles_clients.sql` (trigger `handle_new_auth_user`)  
**Causa raiz:** O Google não envia `company_name` nos metadados. O trigger usa `'Tenant ' || left(new.id::text, 8)` como fallback.  
**Impacto:** Usuários que se cadastram via Google têm a organização nomeada como `Tenant a1b2c3d4`. Precisam editar manualmente nas configurações de conta.  
**Decisão de escopo:** Este bug é uma degradação de UX, não um bloqueante. Está **fora do escopo desta correção**. Será registrado no STATE.md como deferred idea para a Fase 3 (Polish).

---

### BUG-05 — `AuthCallbackPage` erro UI com inline styles [BAIXO / Qualidade]

**Causa raiz:** O estado de erro usa `style={{ ... }}` ao invés de classes Tailwind, inconsistente com o restante do app.  
**Decisão de escopo:** **Fora do escopo desta correção**. Incluído na task de BUG-03 como melhoria oportunista mínima.

---

## 3. Critérios de aceitação

| ID   | Critério |
|------|----------|
| AC-01 | Usuário existente clica "Continuar com Google" → é redirecionado para Google → retorna ao `/auth/callback` → é autenticado → redirecionado para `/admin` |
| AC-02 | Novo usuário clica "Continuar com Google" → completa OAuth → perfil é criado pelo trigger → autenticado → redirecionado para `/admin` |
| AC-03 | O mesmo fluxo funciona em `localhost` (não apenas produção) |
| AC-04 | Em caso de erro OAuth (acesso negado no Google), a página de callback exibe mensagem clara sem stack trace |
| AC-05 | Não há chamada dupla a `ensureProfileExists` durante o callback |
| AC-06 | Todos os erros de tipo (TypeScript) permanecem zero após as mudanças |

---

## 4. Fora de escopo

- Autenticação Google no `apps/client` (tratado na Fase 2 / Sprint 2)  
- Onboarding de nome de organização para novos usuários Google (BUG-04, Fase 3)  
- Testes automatizados de integração OAuth (dependem de mock do Supabase Auth)
