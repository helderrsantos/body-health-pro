# Domain Analysis Report

Data: 2026-05-14
Projeto: bodyhealthpro

## Domain: Avaliacao Fisica e Evolucao Corporal

**Type**: Core Domain

**Ubiquitous Language**: avaliacao, dobras cutaneas, percentual de gordura, massa magra, massa gorda, evolucao

**Business Capability**: transformar medidas antropometricas em diagnostico corporal e historico evolutivo acionavel.

**Key Concepts**:

- Calculo de composicao corporal (Service) - formulas e validacoes de entrada.
- Esquema de campos clinicos (Entity Schema) - vocabulario de medicao.
- Persistencia de avaliacao (Service) - ciclo CRUD de avaliacoes.
- Consulta de evolucao (Use Case Hook) - variacao entre avaliacoes.

**Subdomains**:

1. Motor de Calculo Antropometrico (Core)
   - Concepts: calculo, validacao decimal, resultado clinico.
   - Cohesion: 9/10.
   - Dependencies: -> Cadastro de Clientes.

2. Gestao de Historico de Avaliacoes (Supporting)
   - Concepts: createAvaliacao, getAvaliacoesByCliente, update/delete, latest/history.
   - Cohesion: 8/10.
   - Dependencies: -> Identidade/Tenant.

**Suggested Bounded Context**: AssessmentContext

- Linguistic boundary: termos de avaliacao com significado clinico univoco.
- Integration: Customer/Supplier com ClientRegistryContext e ACL com IdentityTenantContext.

**Dependencies**:

- -> ClientRegistryContext via clienteId e sexo.
- -> IdentityTenantContext via tenantId e criadoPor.
- <- AdminExperienceContext via fluxo de registro/edicao.

**Cohesion Score**: 8/10

---

## Domain: Cadastro e Ciclo de Vida de Clientes

**Type**: Supporting Subdomain

**Ubiquitous Language**: cliente, cadastro, nome normalizado, exclusao logica, paginacao

**Business Capability**: manter base de clientes por tenant para alimentar o fluxo de avaliacao.

**Key Concepts**:

- Listagem, criacao e remocao de clientes.
- Regra de duplicidade por nome normalizado.
- Modelo relacional clientes/tenant.

**Suggested Bounded Context**: ClientRegistryContext

- Linguistic boundary: cliente aqui significa entidade de acompanhamento fisico, nao identidade de login.
- Integration: Open Host Service para leitura por AssessmentContext.

**Dependencies**:

- -> IdentityTenantContext para tenant e permissao.
- <- AssessmentContext consumindo clienteId.

**Cohesion Score**: 8/10

---

## Domain: Identidade, Acesso e Tenant

**Type**: Supporting Subdomain

**Ubiquitous Language**: profile, role, admin, tenant, bootstrap_profile, sessao

**Business Capability**: autenticar usuario, provisionar tenant/perfil e autorizar operacoes.

**Key Concepts**:

- Signup/login/OAuth e sessao.
- Bootstrap de profile e tenant via RPC.
- Tabelas tenants/profiles e funcoes de contexto de usuario.

**Suggested Bounded Context**: IdentityTenantContext

- Linguistic boundary: usuario autenticado e perfil autorizavel.
- Integration: Published Language para claims/perfil e ACL para contextos consumidores.

**Dependencies**:

- <- ClientRegistryContext e AssessmentContext consumindo tenant/role.
- -> PlatformSecurityContext para auditoria e seguranca.

**Cohesion Score**: 7/10

---

## Domain: Plataforma de Persistencia e Seguranca

**Type**: Generic Subdomain

**Ubiquitous Language**: Supabase client, RLS, audit_log, security_log, migrations

**Business Capability**: fornecer infraestrutura multi-tenant segura e auditavel.

**Key Concepts**:

- Cliente de acesso ao banco (Supabase).
- SQL de RLS e politicas por tenant/perfil.
- Tabelas/funcoes de auditoria e seguranca.

**Suggested Bounded Context**: PlatformSecurityContext

- Linguistic boundary: linguagem operacional de plataforma.
- Integration: servicos de infraestrutura consumidos pelos contextos de negocio.

**Cohesion Score**: 6/10

---

## Cross-Domain Cohesion

| Domain A | Domain B | Cohesion | Issue | Recommendation |
| --- | --- | --- | --- | --- |
| Avaliacao Fisica | Cadastro de Clientes | 8/10 | Acoplamento esperado por clienteId | Manter contrato explicito de leitura de cliente |
| Avaliacao Fisica | Identidade/Tenant | 5/10 | UI mistura calculo, auth e persistencia | Extrair Application Service para orquestracao |
| Avaliacao Fisica | Plataforma/Supabase | 4/10 | Regras de erro tecnicas no servico funcional | Aplicar ACL e tradutor de erro de infraestrutura |
| Cadastro de Clientes | Identidade/Tenant | 7/10 | Dependencia legitima de tenant e role | Preservar interface de autorizacao |
| Identidade/Tenant | Plataforma/Seguranca | 8/10 | Integracao forte e esperada | Manter fronteiras explicitas |

---

## Issues Detected

### Priority: High

**Issue**: responsabilidades mistas no fluxo de avaliacao.

- **Location**: apps/admin/src/components/BodyCompositionCalculator.tsx
- **Problem**: o componente executa calculo, composicao de payload multi-tenant, persistencia e controle de UX.
- **Concepts**: avaliacao, tenant, persistencia, formulario.
- **Cohesion**: 4/10.
- **Recommendation**: separar Application Service de avaliacao e manter o componente na funcao de presenter/form.

### Priority: High

**Issue**: policy de cliente para avaliacao contradiz a intencao do dominio.

- **Location**: packages/database/sql/phase2_avaliacoes.sql
- **Problem**: policy cliente_view_own_avaliacoes foi criada com condicao sempre falsa, bloqueando leitura do proprio historico.
- **Concepts**: cliente, avaliacao, acesso proprio.
- **Cohesion**: 3/10.
- **Recommendation**: alinhar policy ao caso de uso de leitura propria por vinculo profile/cliente/tenant.

### Priority: Medium

**Issue**: servico de avaliacao acoplado a detalhes de migracao/infra.

- **Location**: apps/admin/src/services/avaliacoes/avaliacoes.service.ts
- **Problem**: o servico inclui traducoes de erro com referencias operacionais de SQL/migracao.
- **Concepts**: avaliacao, RLS, schema migration.
- **Cohesion**: 5/10.
- **Recommendation**: mover interpretacao de erros tecnicos para camada de infraestrutura (ACL/adapter).

### Priority: Medium

**Issue**: contextos de experiencia client/site ainda nao existem de fato.

- **Location**: apps/client/src/App.tsx, apps/site/src/App.tsx
- **Problem**: ambos os apps estao em scaffold inicial sem linguagem de dominio.
- **Concepts**: dashboard do cliente, site institucional.
- **Cohesion**: 2/10.
- **Recommendation**: formalizar ClientExperienceContext e MarketingContext antes de ampliar features.

---

## Suggested Bounded Contexts

### AssessmentContext

**Contains Subdomains**:

- Motor de Calculo Antropometrico (Core)
- Historico de Avaliacoes (Supporting)

**Ubiquitous Language**:

- Avaliacao: registro clinico com metricas e data.
- Evolucao: variacao entre avaliacoes sequenciais.

**Integration Requirements**:

- Consumes from: ClientRegistryContext via Customer/Supplier.
- Consumes from: IdentityTenantContext via ACL.

**Implementation Notes**:

- Persistencia dedicada de avaliacoes.
- API explicita para criar/listar/comparar.

### ClientRegistryContext

**Contains Subdomains**:

- Cadastro de Clientes (Supporting)

**Ubiquitous Language**:

- Cliente: pessoa acompanhada clinicamente.
- Status: ativo/inativo para operacao.

**Integration Requirements**:

- Publishes to: AssessmentContext via Open Host Service.

### IdentityTenantContext

**Contains Subdomains**:

- Autenticacao e Provisionamento (Supporting)

**Ubiquitous Language**:

- Profile: identidade autorizavel com role.
- Tenant: fronteira de isolamento organizacional.

**Integration Requirements**:

- Publishes to: AssessmentContext e ClientRegistryContext via Published Language.

### PlatformSecurityContext

**Contains Subdomains**:

- Auditoria e Seguranca (Generic)
- Infra de Persistencia (Generic)

**Integration Requirements**:

- Fornece capacidades transversais para todos os contextos.

---

## Evidencias Tecnicas (Arquivos Chave)

- packages/core/src/bodyComposition.ts
- packages/core/src/clientSchema.ts
- apps/admin/src/services/avaliacoes/avaliacoes.service.ts
- apps/admin/src/services/clients/clients.service.ts
- apps/admin/src/services/auth/auth.service.ts
- apps/admin/src/components/BodyCompositionCalculator.tsx
- apps/admin/src/hooks/useAvaliacoes.ts
- packages/database/sql/phase1_auth_roles_clients.sql
- packages/database/sql/phase2_avaliacoes.sql
- apps/client/src/App.tsx
- apps/site/src/App.tsx

---

## Conclusao

O Core Domain esta bem definido no fluxo de avaliacao corporal. Os principais riscos atuais estao na fronteira entre camadas (mistura de responsabilidades no front) e em uma inconsistencia de policy RLS que conflita com o caso de uso de cliente. A recomendacao estrategica e consolidar os quatro bounded contexts propostos e explicitar contratos de integracao entre eles antes da expansao funcional do app client.