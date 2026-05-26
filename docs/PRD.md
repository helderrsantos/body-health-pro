# Product Requirements Document (PRD)

## 1. Informacoes do documento

- Produto: Body Health Pro
- Versao: 1.0
- Data: 2026-05-20
- Status: Draft para alinhamento
- Dono do produto: A definir
- Stakeholders: Time Admin, Time Cliente, Operacao Clinica, Engenharia, Dados

## 2. Resumo executivo

Body Health Pro e uma plataforma para avaliacao corporal com foco em profissionais que acompanham clientes por historico e evolucao. O produto tem tres experiencias principais:

- Admin App: operacao do profissional (cadastro, avaliacao, historico, comparativos, relatorios)
- Client App: acompanhamento do proprio progresso pelo cliente final
- Site: aquisicao e posicionamento institucional

O diferencial central e transformar medidas antropometricas em indicadores acionaveis (percentual de gordura, massa magra e massa gorda), com trilha historica por cliente e seguranca multi-tenant via Supabase + RLS.

## 3. Problema e oportunidade

### Problemas atuais do mercado

- Profissionais registram avaliacoes em planilhas ou ferramentas desconectadas.
- Historico evolutivo fica fragmentado e dificil de explicar ao cliente.
- Falta visibilidade do cliente sobre o proprio progresso entre consultas.
- Risco de vazamento de dados quando nao ha isolamento por tenant e controles de acesso.

### Oportunidade

Entregar uma plataforma unica para:

- Registrar avaliacoes rapidamente
- Visualizar evolucao longitudinal
- Comunicar resultado com clareza (tabelas, comparativos, relatorios)
- Garantir seguranca e isolamento de dados desde o inicio

## 4. Objetivos de produto

### Objetivos de negocio

- Aumentar retencao de clientes das clinicas por melhor acompanhamento.
- Reduzir tempo operacional por avaliacao no fluxo do profissional.
- Criar base para recorrencia (planos e funcionalidades premium no futuro).

### Objetivos de usuario

- Profissional: registrar e consultar avaliacoes com confianca e velocidade.
- Cliente: entender evolucao e manter engajamento no plano.

### Metas de sucesso (12 meses)

- >= 70% dos clientes ativos com pelo menos 2 avaliacoes registradas.
- <= 3 minutos de tempo medio para registrar uma nova avaliacao no admin.
- >= 60% de usuarios cliente retornando mensalmente ao app.
- 0 incidentes graves de cross-tenant data leakage.

## 5. Personas

### Persona 1: Profissional (Admin)

- Perfil: nutricionista, personal trainer, clinica de avaliacao fisica
- Necessidades: cadastro rapido, historico confiavel, comparacao antes/depois, exportacao
- Dor principal: retrabalho manual e dificuldade de demonstrar evolucao

### Persona 2: Cliente final (Client)

- Perfil: pessoa em acompanhamento de composicao corporal
- Necessidades: ver progresso com linguagem simples
- Dor principal: baixa clareza sobre resultados e motivacao entre consultas

### Persona 3: Gestor da operacao

- Perfil: responsavel por equipe e qualidade de atendimento
- Necessidades: seguranca, padronizacao e rastreabilidade

## 6. Escopo do produto

### Em escopo (MVP e expansao imediata)

- Autenticacao e autorizacao por perfil (admin/client)
- Isolamento por tenant
- Cadastro e ciclo de vida de clientes
- Registro de avaliacoes antropometricas
- Historico e comparacao de avaliacoes
- Dashboard do cliente com evolucao
- Relatorios (PDF) no fluxo admin

### Fora de escopo (neste ciclo)

- Telemetria analitica avancada com BI externo
- Recomendacao automatica por IA clinica
- Integracoes com wearables de terceiros
- White-label completo multi-brand

## 7. Requisitos funcionais

### RF-01 Autenticacao e sessao

- Sistema deve permitir login/logout para admin e cliente.
- Sistema deve identificar tenant e role do usuario autenticado.

### RF-02 Gestao de clientes

- Admin deve criar, listar, editar e desativar clientes.
- Sistema deve prevenir duplicidade por regras de normalizacao de nome.

### RF-03 Registro de avaliacao

- Admin deve registrar avaliacao com medidas obrigatorias e opcionais.
- Sistema deve calcular automaticamente percentual de gordura, massa magra e massa gorda.
- Sistema deve persistir data da avaliacao, autor e tenant.

### RF-04 Historico e comparativo

- Admin deve visualizar historico ordenado por data.
- Admin deve comparar pelo menos duas avaliacoes do mesmo cliente.
- Sistema deve destacar variacoes relevantes entre periodos.

### RF-05 Dashboard do cliente

- Cliente deve visualizar somente suas avaliacoes.
- Cliente deve visualizar tendencia de indicadores chave ao longo do tempo.

### RF-06 Relatorios

- Admin deve gerar relatorio em PDF para avaliacao unica e comparativa.
- Relatorio deve conter resumo numerico e visualizacao grafica basica.

### RF-07 Auditoria e seguranca

- Sistema deve manter trilha de criacao/atualizacao/exclusao quando aplicavel.
- Politicas de acesso devem bloquear leitura/escrita fora do tenant.

## 8. Requisitos nao funcionais

### RNF-01 Seguranca

- Row Level Security ativo nas tabelas criticas.
- Validacao de autorizacao em todas as operacoes sensiveis.

### RNF-02 Performance

- Consultas de historico devem responder em ate 1.5s para base padrao de uso.
- Evitar SELECT * em consultas de leitura frequente.

### RNF-03 Confiabilidade

- Operacoes de registro de avaliacao devem ser idempotentes no frontend quando houver retry.
- Erros de infraestrutura devem ser traduzidos para mensagens acionaveis.

### RNF-04 Escalabilidade

- Arquitetura deve suportar crescimento de tenants sem degradar isolamento.

### RNF-05 Qualidade de codigo

- Type safety sem uso de any em fluxo de dominio.
- Camadas com responsabilidade clara (UI, hook, service, infra).

## 9. Fluxos principais

### Fluxo A: Admin registra avaliacao

1. Admin seleciona cliente.
2. Admin preenche medidas.
3. Sistema valida campos e calcula indicadores.
4. Sistema salva avaliacao no tenant correto.
5. Historico e comparativos sao atualizados.

### Fluxo B: Cliente consulta evolucao

1. Cliente faz login.
2. Sistema carrega historico proprio.
3. Dashboard apresenta tendencia e ultimos resultados.

### Fluxo C: Admin gera relatorio

1. Admin escolhe avaliacao unica ou comparativa.
2. Sistema monta dados e graficos.
3. Sistema exporta PDF para download.

## 10. Arquitetura de produto (alto nivel)

- Frontend: apps/admin, apps/client, apps/site (React + Vite)
- Dominio compartilhado: packages/core (calculos e validacoes)
- Dados: Supabase Postgres com RLS e politicas por role/tenant
- Infra compartilhada: packages/database, packages/auth, packages/validation, packages/ui

Bounded contexts principais:

- AssessmentContext (avaliacao e evolucao)
- ClientRegistryContext (cadastro de clientes)
- IdentityTenantContext (auth, role, tenant)
- PlatformSecurityContext (RLS, auditoria, infraestrutura)

## 11. Backlog priorizado

### Fase 1 (base operacional)

- Auth + profiles + tenant bootstrap
- Cadastro de clientes
- Motor de calculo e formulario inicial no admin

### Fase 2 (historico e valor clinico)

- Tabela e servico de avaliacoes
- Historico por cliente
- Comparativo antes/depois
- Inicio do app client (dashboard e historico)

### Fase 3 (polimento e escala)

- Otimizacao de queries e UX
- Fortalecimento de auditoria
- Expansao de relatorios
- Preparacao para features premium

## 12. Dependencias e premissas

- Supabase como backend principal de auth + banco.
- Disponibilidade de politicas RLS revisadas para app cliente.
- Time de produto e clinico para validar linguagem de indicadores.
- Ambiente de deploy para tres apps no monorepo.

## 13. Riscos e mitigacoes

- Risco: regras RLS bloquearem casos legitimos do cliente.
  - Mitigacao: suite de testes de autorizacao por perfil/tenant.

- Risco: acoplamento alto entre services e detalhes SQL.
  - Mitigacao: camada ACL/adapters para traducao de erros tecnicos.

- Risco: queda de performance com crescimento do historico.
  - Mitigacao: seletividade de colunas, indices compostos e revisao de queries.

## 14. Metricas e observabilidade

- Ativacao
  - taxa de onboarding de admins
  - tempo para primeira avaliacao registrada

- Engajamento
  - clientes com retorno mensal
  - media de avaliacoes por cliente ativo

- Operacao
  - tempo de resposta de listagem/historico
  - taxa de erro por endpoint/operacao

- Seguranca
  - falhas de autorizacao por policy
  - incidentes de acesso indevido (target: zero)

## 15. Criterios de aceitacao do ciclo atual

- Admin consegue criar cliente e registrar avaliacao fim a fim.
- Historico e comparativo funcionam para um cliente com 2+ avaliacoes.
- Cliente autenticado visualiza apenas o proprio historico.
- PDF de avaliacao unica e comparativa e gerado com sucesso.
- Politicas RLS validadas para cenarios admin e cliente.

## 16. Proximos passos

1. Validar este PRD com stakeholders de produto e operacao clinica.
2. Quebrar requisitos em epicos e historias (admin, client, plataforma).
3. Definir baseline de metricas e plano de instrumentacao.
4. Revisar riscos criticos em seguranca e performance antes do proximo release.