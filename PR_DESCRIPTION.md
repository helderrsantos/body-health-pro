## O que
Este PR combina melhorias de interface no admin com atualização do catálogo de skills do agente, além de limpeza de código legado no histórico de avaliações.

## Por que
As mudanças melhoram a usabilidade em telas menores, reduzem complexidade de manutenção no componente de histórico e registram oficialmente as novas skills instaladas no projeto.

## Mudanças
- Simplificação do componente apps/admin/src/components/EvaluationHistory.tsx, com remoção de um bloco grande de código legado/comentado relacionado à geração de PDF.
- Ajuste de layout no menu do usuário em apps/admin/src/components/home/HomeUserMenu.tsx:
  - Botões agora ocupam melhor o espaço em mobile com comportamento responsivo.
  - Estrutura visual do container foi levemente refinada para consistência.
- Atualização do lock de skills em skills-lock.json, incluindo:
  - building-components
  - vercel-composition-patterns
  - vercel-react-best-practices
  - web-design-guidelines
- Inclusão de arquivos de skills e metadados nas pastas .agents e .claude gerados pelas instalações recentes.

## Impacto esperado
- Melhor experiência de uso no menu principal do admin em dispositivos menores.
- Código mais limpo e simples de evoluir no histórico de avaliações.
- Ambiente de agente mais completo e consistente para tarefas de frontend e boas práticas.

## Testes
- Testes automatizados não executados nesta etapa.
- Recomenda-se validação manual de:
  - responsividade do menu no admin;
  - exportação/visualização de PDF no histórico de avaliações;
  - integridade dos arquivos de skills adicionados.

## Observações
- Há indícios de caracteres com encoding incorreto em textos do PDF no componente de histórico; vale revisar antes do merge para evitar regressão visual.