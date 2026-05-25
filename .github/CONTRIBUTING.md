# Fluxo de contribuição

## Branches

| Prefixo | Quando usar | Exemplo |
|---|---|---|
| `feat/` | Nova funcionalidade | `feat/avaliacao-pdf-export` |
| `fix/` | Correção de bug | `fix/supabase-paused-error` |
| `refactor/` | Refatoração sem mudança de comportamento | `refactor/queryClient-extract` |
| `chore/` | Infra, config, dependências | `chore/vitest-setup` |
| `docs/` | Documentação | `docs/readme-update` |

## Passo a passo

```bash
# 1. Atualiza master local
git checkout master && git pull

# 2. Cria branch
git checkout -b feat/nome-da-feature

# 3. Trabalha e commita (commits atômicos, mensagem descritiva)
git commit -m "feat: descrição do que foi feito"

# 4. Push e abre PR
git push -u origin feat/nome-da-feature
gh pr create --base master
```

## Commits

Seguir o padrão [Conventional Commits](https://www.conventionalcommits.org):

```
feat:     nova funcionalidade
fix:      correção de bug
refactor: mudança de código sem alterar comportamento
chore:    atualização de dependências, config
docs:     documentação
test:     adição ou correção de testes
```

## Build antes do PR

```bash
npm run lint          # sem erros de lint
npm run test          # testes passando
npm run build         # build sem erros TypeScript
```
