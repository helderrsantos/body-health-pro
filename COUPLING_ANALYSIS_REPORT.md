# Relatorio de Acoplamento (Strength, Distance, Volatility)

Data: 2026-05-14  
Codebase: bodyhealthpro

## 1. Executive Summary

- Modules analyzed: 14
- Dependencies mapped: 18
- Critical issues: 2
- Moderate issues: 3
- Overall health score: Attention

Escopo analisado: monorepo completo com foco em `apps/admin`, `packages/core`, `packages/database/sql` e sinais de volatilidade via Git (6 meses).

Resultado geral: a arquitetura tem boa base de coesao no dominio de avaliacao, mas ha acoplamentos fortes com infraestrutura SQL e duplicacao funcional em pontos de alta mudanca.

## 2. Dependency Map

```text
[apps/admin/src/components/BodyCompositionCalculator.tsx] --[CONTRACT]--> [packages/core/src/bodyComposition.ts]
[apps/admin/src/components/BodyCompositionCalculator.tsx] --[MODEL]--> [apps/admin/src/hooks/useAvaliacoes.ts]
[apps/admin/src/hooks/useAvaliacoes.ts] --[MODEL]--> [apps/admin/src/services/avaliacoes/avaliacoes.service.ts]
[apps/admin/src/services/avaliacoes/avaliacoes.service.ts] --[MODEL]--> [apps/admin/src/lib/supabase.ts]
[apps/admin/src/services/auth/auth.service.ts] --[FUNCTIONAL:sequential]--> [packages/database/sql/phase1_auth_roles_clients.sql]
[apps/admin/src/services/avaliacoes/avaliacoes.service.ts] --[FUNCTIONAL:sequential]--> [packages/database/sql/phase2_avaliacoes.sql]
[apps/admin/src/services/avaliacoes/avaliacoes.service.ts] --[FUNCTIONAL:sequential]--> [packages/database/sql/phase3_avaliacoes_medidas.sql]
[apps/admin/src/services/clients/clients.service.ts] --[MODEL]--> [packages/database/sql/phase1_auth_roles_clients.sql]
```

## 3. Volatility Assessment

Dados de churn (ultimos 6 meses) apontam alta volatilidade em:

1. `apps/admin/src/components/EvaluationHistory.tsx`
2. `apps/admin/src/pages/ClientDetailPage.tsx`
3. `apps/admin/src/services/auth/auth.service.ts`
4. `apps/admin/src/components/BodyCompositionCalculator.tsx`
5. `apps/admin/src/services/avaliacoes/avaliacoes.service.ts`
6. `packages/database/sql/phase1_auth_roles_clients.sql`
7. `packages/database/sql/phase2_avaliacoes.sql`

Conclusao de volatilidade:

- Core subdomain: calculo antropometrico em `packages/core/src/bodyComposition.ts`, estavel/moderado.
- Supporting de maior mudanca: fluxo admin de avaliacao e autenticacao.
- Generic infra com mudanca relevante: scripts SQL de seguranca e schema.

## 4. Identified Issues (by severity)

### 4.1 CRITICAL - Acoplamento funcional forte entre servico e migracoes SQL

- Modules involved: admin service -> database/sql
- Coupling type: Functional coupling (sequential), com tracos intrusivos
- Connascence level: Name + Meaning (codigos de erro e nomes de migracao)

Evidence:

- `apps/admin/src/services/avaliacoes/avaliacoes.service.ts` contem mensagens operacionais explicitas apontando para scripts especificos.
- `apps/admin/src/services/auth/auth.service.ts` tambem referencia hotfix SQL por nome de arquivo.

Dimensions:

- Strength: HIGH
- Distance: MEDIUM/HIGH (app vs infra SQL package)
- Volatility: HIGH
- Balance score: CRITICAL

Impact:

- Mudancas em policy/schema quebram UX e exigem coordenacao entre app e SQL.

### 4.2 CRITICAL - Contrato de acesso cliente inconsistente com objetivo do produto

- Modules involved: policy RLS -> fluxo de historico de avaliacoes
- Coupling type: Functional coupling (rule coupling)
- Connascence level: Meaning (regra de autorizacao)

Evidence:

- `packages/database/sql/phase2_avaliacoes.sql` define politica `cliente_view_own_avaliacoes` como `false`.
- Escopo de produto preve app cliente com leitura de historico.

Dimensions:

- Strength: HIGH
- Distance: HIGH (DB policy impacta app cliente/admin roadmap)
- Volatility: HIGH
- Balance score: CRITICAL

Impact:

- Evolucao do app cliente fica bloqueada por regra de seguranca desalinhada.

### 4.3 MODERATE - Duplicacao funcional de consulta de avaliacoes no hook

- Modules involved: `useAvaliacoes` -> `avaliacoes.service`
- Coupling type: Functional coupling (sequential/redundant)
- Connascence level: Algorithm

Evidence:

- `apps/admin/src/hooks/useAvaliacoes.ts` dispara query do historico e query da ultima avaliacao separadamente.

Dimensions:

- Strength: MEDIUM
- Distance: LOW
- Volatility: HIGH
- Balance score: ATTENTION

Impact:

- Mais round trips e risco de inconsistencias temporais entre duas consultas.

### 4.4 MODERATE - Model coupling alto no mapeamento de avaliacao

- Modules involved: `avaliacoes.service` -> tabela `avaliacoes`
- Coupling type: Model coupling
- Connascence level: Name + Type + Meaning

Evidence:

- `apps/admin/src/services/avaliacoes/avaliacoes.service.ts` repete grandes mapeamentos em create, update, list e latest.

Dimensions:

- Strength: MEDIUM/HIGH
- Distance: LOW/MEDIUM
- Volatility: HIGH
- Balance score: ATTENTION

Impact:

- Mudanca de coluna exige multiplas alteracoes no mesmo servico.

### 4.5 MODERATE - Fronteira de pacote compartilhado incompleta (database/auth)

- Modules involved: `apps/admin` -> `packages/database`, `packages/auth`
- Coupling type: ausencia de contract coupling (acesso direto ao SDK no app)

Evidence:

- `apps/admin/src/lib/supabase.ts` cria client direto.
- `packages/database/src/client.ts` existe, mas nao e consumido no admin.
- `packages/auth/package.json` existe sem implementacao.

Dimensions:

- Strength: LOW hoje (risco de crescimento)
- Distance: MEDIUM
- Volatility: MEDIUM/HIGH
- Balance score: ACCEPTABLE (com risco futuro)

Impact:

- Maior chance de divergencia entre apps quando `client` e `site` evoluirem.

## 5. Positive Patterns Found

1. Contract coupling saudavel entre UI e motor de calculo por API explicita em `packages/core/src/index.ts` e consumo em `apps/admin/src/components/BodyCompositionCalculator.tsx`.
2. Bom encapsulamento de criacao de client Supabase no pacote em `packages/database/src/client.ts` (apesar de subutilizado).
3. Estrutura de dominio e boundaries documentada em `DOMAIN_ANALYSIS_REPORT.md`, reduzindo ambiguidade semantica.

## 6. Prioritized Recommendations

### High priority

1. Introduzir ACL de infraestrutura para traduzir erros tecnicos em um unico ponto e remover referencia a arquivos de migracao dentro dos services de app.
2. Corrigir policy de leitura do cliente em avaliacoes para alinhar com o caso de uso do app client e manter isolamento por tenant/profile.
3. Extrair mapper unico de `AvaliacaoRow <-> Avaliacao` para eliminar duplicacao e reduzir connascence de nome.

### Medium priority

1. Unificar busca de historico + latest no hook, derivando latest da lista ordenada.
2. Padronizar uso do pacote compartilhado de acesso a banco no admin e preparar adocao futura no app client.
3. Formalizar pacote `auth` compartilhado antes de expandir autenticacao no app client.

### Low priority

1. Definir contrato versionado para payload de avaliacao (DTO de integracao) antes de abrir APIs para multiplos consumidores.
2. Medir co-change entre arquivos de service SQL e hooks para detectar novos pontos de coupling funcional.

## 7. Assumptions and Limits

1. Distancia social entre times nao foi medida (sem evidencia de ownership por equipe).
2. Volatilidade foi estimada por churn tecnico e sinais de dominio, sem telemetria de incidentes em producao.
3. Analise de acoplamento simetrico entre apps e limitada porque `apps/client` e `apps/site` ainda estao em scaffold.
