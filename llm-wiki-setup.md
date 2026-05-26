# LLM Wiki — Setup Prompt for Claude Code

## Goal

Bootstrap a personal knowledge base for the **Software/Technology** domain using the LLM Wiki
pattern described by Andrej Karpathy. The system compiles raw source documents into a persistent,
interlinked wiki maintained entirely by you (the LLM).

You are currently in the root directory where `raw/` and `wiki/` will be created. Execute every
step below to completion before moving to the next one. At the end, run the verification checklist
and report results.

---

## Step 1 — Create the directory structure

Create the following folders (create intermediate directories as needed):

```
raw/
raw/assets/
wiki/
wiki/entities/
wiki/concepts/
wiki/sources/
wiki/outputs/
tools/
```

**Ownership rules (critical — never violate):**
- `raw/` is owned by the human. You read from it; you never write, rename, or delete anything in it.
- `wiki/` is owned by you. You create, update, and maintain every file in it.
- `tools/` is owned by you. You create and maintain CLI scripts here.

---

## Step 2 — Create `CLAUDE.md`

This is the schema file. It is the authoritative reference for all future sessions.
Read it at the start of every session before doing anything else.

Create `CLAUDE.md` at the root with the following exact content:

```markdown
# LLM Wiki — Schema

## Domain
Software/Technology: libraries, frameworks, tools, programming languages, architectural patterns,
protocols, standards, papers, blog posts, documentation, repositories, changelogs.

## Language
All wiki content (page bodies, summaries, cross-references, section headings) must be written in
**Brazilian Portuguese (pt-br)**. File names use lowercase kebab-case in English
(e.g., `react-server-components.md`, `dependency-injection.md`). This file (CLAUDE.md) stays
in English.

## Directory layout

| Path              | Owner  | Rule                                                          |
|-------------------|--------|---------------------------------------------------------------|
| `raw/`            | Human  | Immutable source documents. LLM reads only, never modifies.  |
| `raw/assets/`     | Human  | Images downloaded from clipped articles.                     |
| `wiki/`           | LLM    | All LLM-generated markdown files.                            |
| `wiki/entities/`  | LLM    | One page per named entity (tool, lib, framework, company, person, protocol, standard). |
| `wiki/concepts/`  | LLM    | One page per concept, pattern, technique, or architectural principle. |
| `wiki/sources/`   | LLM    | One summary page per ingested raw source.                    |
| `wiki/outputs/`   | LLM    | Filed answers, analyses, comparisons generated during queries. |
| `wiki/index.md`   | LLM    | Content catalog. Updated on every ingest and every filed output. |
| `wiki/log.md`     | LLM    | Append-only chronological log. Never edit past entries.      |
| `wiki/overview.md`| LLM    | High-level synthesis of the entire wiki. Updated periodically. |
| `tools/`          | LLM    | CLI scripts for operating on the wiki.                       |

## YAML frontmatter

Every wiki page must begin with YAML frontmatter. Use the template below, removing fields
that do not apply to the page type:

```yaml
---
title: "Title of the page"
type: source | entity | concept | output
tags: []
date: "YYYY-MM-DD"
status: draft | stable | outdated
source_count: 0      # entities and concepts only — number of raw sources informing this page
source_file: ""      # sources only — relative path to the file in raw/
---
```

## Operation: Ingest

Triggered when the user adds a file to `raw/` and asks you to process it.

1. Read the source file fully. If it references images in `raw/assets/`, read the text first,
   then view relevant images separately.
2. If the user wants to stay involved, summarize the key takeaways and discuss before writing.
3. Create `wiki/sources/<kebab-case-title>.md` with a structured summary (see Source page format).
4. Identify all entities mentioned → create or update their pages in `wiki/entities/`.
5. Identify all concepts touched → create or update their pages in `wiki/concepts/`.
6. Update `wiki/index.md`: add the new source entry; update touched entity/concept entries.
7. Update `wiki/overview.md` if the source significantly shifts the synthesis.
8. Append an entry to `wiki/log.md`:
   `## [YYYY-MM-DD] ingest | <source title>`
   followed by 2–3 bullet points summarizing what changed across the wiki.

A single ingest typically touches 10–15 wiki pages. That is expected and correct.

## Operation: Query

Triggered when the user asks a question against the wiki.

1. Read `wiki/index.md` to identify relevant pages.
2. Read those pages. Follow cross-references as needed.
3. If the wiki is large, use `python tools/search.py "<keywords>"` to locate relevant pages first.
4. Synthesize a response in pt-br with citations: `[page title](../entities/page.md)`.
5. If the answer is valuable (comparison, analysis, a non-obvious connection), offer to file it
   into `wiki/outputs/<kebab-case-title>.md`.
6. If filed, update `wiki/index.md` and append to `wiki/log.md`:
   `## [YYYY-MM-DD] query | <question summary>`

## Operation: Lint

Triggered explicitly by the user, or suggested by you after every ~10 ingests.

Scan the wiki for:
- Contradictions between pages — flag with a `> ⚠️ Inconsistência:` blockquote inline.
- Stale claims superseded by newer sources — mark with `status: outdated` in frontmatter.
- Orphan pages — pages with no inbound links from other wiki pages.
- Concepts or entities mentioned in source summaries but lacking their own page (create stubs).
- Missing cross-references between clearly related pages.
- Entity/concept pages with `source_count: 0` (likely empty stubs — prioritize filling them).
- Data gaps that could be filled by a web search (suggest to the user, do not invent data).

After linting, append to log:
`## [YYYY-MM-DD] lint | <brief summary of findings>`

## Page formats

### Source page (`wiki/sources/`)
```
---
title: ""
type: source
tags: []
date: ""
status: stable
source_file: "raw/<filename>"
---

# <Title>

## Resumo
<2–4 paragraph summary of the source in pt-br.>

## Pontos-chave
- <key point 1>
- <key point 2>
...

## Entidades mencionadas
- [Entity name](../entities/entity.md) — brief note on relevance

## Conceitos abordados
- [Concept name](../concepts/concept.md) — brief note

## Citações relevantes
> "<quote from the source>"
```

### Entity page (`wiki/entities/`)
```
---
title: ""
type: entity
tags: []
date: ""
status: draft | stable
source_count: 0
---

# <Entity name>

<2–3 sentence description in pt-br.>

## Características principais
- ...

## Relações
- Relacionado a: [Concept](../concepts/concept.md)
- Alternativa a: [Other entity](../entities/other.md)

## Fontes
- [Source title](../sources/source.md)
```

### Concept page (`wiki/concepts/`)
```
---
title: ""
type: concept
tags: []
date: ""
status: draft | stable
source_count: 0
---

# <Concept name>

<2–3 sentence definition in pt-br.>

## Por que importa

## Exemplos e aplicações

## Relações
- Manifestado em: [Entity](../entities/entity.md)
- Relacionado a: [Other concept](../concepts/other-concept.md)

## Fontes
- [Source title](../sources/source.md)
```

## Cross-references
Use standard markdown links: `[React](../entities/react.md)`.
Always link entity and concept names on their **first mention** within any page.
After creating or updating pages, scan existing pages for unlinked mentions of the subject
and add the link retroactively.

## index.md conventions
Organized in four sections: **Fontes**, **Entidades**, **Conceitos**, **Outputs**.
Each entry format: `- [Title](path/to/page.md) — one-line summary *(N fontes)*`
Update this file on every ingest, every filed output, and every lint pass.

## log.md conventions
Append-only. Never delete, edit, or reorder past entries.
Each entry starts with: `## [YYYY-MM-DD] <operation> | <title>`
Operations: `ingest`, `query`, `lint`, `setup`.

## Search tool
`tools/search.py` provides CLI search over all wiki markdown files.
Usage: `python tools/search.py "query terms"`
Optional flag: `--type entity|concept|source|output` to filter by frontmatter type.
Use this tool when answering queries that may span many pages.

## Image handling
1. Read the source markdown text in full first.
2. Then view referenced images in `raw/assets/` separately for additional context.
3. Reference images in wiki pages with relative paths:
   `![alt text](../../raw/assets/image-name.png)`

## Evolving this schema
Update this file whenever a workflow or convention change is agreed upon with the user.
Treat it as source code: precise, current, and authoritative.
```

---

## Step 3 — Create initial wiki files

### `wiki/index.md`

Create with this content, replacing `<TODAY>` with today's date in `YYYY-MM-DD` format:

```markdown
---
title: "Índice da Wiki"
type: index
date: "<TODAY>"
---

# Índice da Wiki — Software/Tecnologia

> Mantido pelo LLM. Leia este arquivo antes de responder qualquer consulta.
> Atualizado a cada ingestão, output arquivado ou lint.

## Fontes

_Nenhuma fonte ingerida ainda._

## Entidades

_Nenhuma entidade registrada ainda._

## Conceitos

_Nenhum conceito registrado ainda._

## Outputs

_Nenhum output arquivado ainda._
```

### `wiki/log.md`

Create with this content, replacing `<TODAY>` with today's date:

```markdown
# Log da Wiki

> Registro cronológico append-only. Nunca editar ou deletar entradas passadas.
> Formato de entrada: `## [YYYY-MM-DD] <operação> | <título>`

## [<TODAY>] setup | Inicialização da wiki

- Estrutura de pastas criada (`raw/`, `wiki/`, `tools/` e subdiretórios).
- `CLAUDE.md`, `wiki/index.md`, `wiki/log.md` e `wiki/overview.md` inicializados.
- Repositório git inicializado com commit inicial.
- Ferramenta de busca CLI criada em `tools/search.py`.
```

### `wiki/overview.md`

Create with this content, replacing `<TODAY>` with today's date:

```markdown
---
title: "Visão Geral"
type: overview
date: "<TODAY>"
status: draft
---

# Visão Geral — Base de Conhecimento em Software/Tecnologia

> Síntese de alto nível mantida pelo LLM. Atualizada após ingests significativos.

Esta wiki documenta e conecta conhecimento na área de software e tecnologia —
bibliotecas, frameworks, ferramentas, padrões arquiteturais, protocolos, linguagens
de programação e publicações técnicas.

## Estado atual

- **Fontes ingeridas:** 0
- **Entidades mapeadas:** 0
- **Conceitos documentados:** 0
- **Outputs arquivados:** 0

## Temas principais

_Será preenchido após as primeiras ingestões._

## Conexões e tensões emergentes

_Será preenchido conforme a wiki cresce._

## Próximas áreas sugeridas para exploração

_Será preenchido pelo LLM durante operações de lint._
```

---

## Step 4 — Create `tools/search.py`

Create `tools/search.py` as a CLI search script with the following requirements:

- Accepts a positional argument: the search query string.
- Case-insensitive. Multiple words are treated as AND logic (all words must appear in the file).
- Recursively searches all `.md` files under `wiki/`.
- For each match, prints: relative file path, line number, and ±2 lines of context. Separate
  results from different files with a blank line.
- Accepts an optional `--type` flag to filter results by the `type:` field in YAML frontmatter
  (e.g., `--type entity` only returns entity pages).
- If no results, prints: `Nenhum resultado encontrado para: "<query>"`
- Uses only the Python standard library (no external dependencies).
- Must run correctly with: `python tools/search.py "test query"`

---

## Step 5 — Create `.gitignore`

Create `.gitignore` at the root with this content:

```
# OS
.DS_Store
Thumbs.db
desktop.ini

# Editors
.obsidian/
.vscode/
*.swp
*.swo

# Python
__pycache__/
*.pyc
*.pyo
.venv/
venv/
env/

# Temporary files
*.tmp
*.bak
~*
```

---

## Step 6 — Initialize git repository

Run the following commands in sequence:

```bash
git init
git add CLAUDE.md wiki/index.md wiki/log.md wiki/overview.md tools/search.py .gitignore
git commit -m "chore: initialize LLM wiki for software/technology domain"
```

---

## Step 7 — Verification checklist

After completing all steps, verify each item and report the result (pass/fail) for every check:

- [ ] `raw/` and `raw/assets/` directories exist and are empty.
- [ ] `wiki/entities/`, `wiki/concepts/`, `wiki/sources/`, `wiki/outputs/` directories exist.
- [ ] `CLAUDE.md` exists at the root and contains the full schema content.
- [ ] `wiki/index.md` exists with correct YAML frontmatter and today's date.
- [ ] `wiki/log.md` exists with the initial setup entry and today's date.
- [ ] `wiki/overview.md` exists with correct frontmatter and today's date.
- [ ] `tools/search.py` exists and runs without errors:
      `python tools/search.py "test"` should print `Nenhum resultado encontrado`.
- [ ] `tools/search.py --type entity "test"` runs without errors.
- [ ] `.gitignore` exists at the root.
- [ ] `git log --oneline` shows exactly one commit: the initial setup commit.

Report all results. If any check fails, fix it before declaring setup complete.

---

## You are now ready

The wiki is initialized and ready for its first ingest. When the user adds a source file to
`raw/` and asks you to process it, follow the **Ingest** operation defined in `CLAUDE.md`.

Remember: you write the wiki; the human curates the sources and asks the questions.
