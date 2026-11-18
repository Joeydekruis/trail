# Inventaris: kennis / docs (stap 1 — alleen lezen)

**Datum:** 2026-11-18  
**Beslissing:** [ADR-008](../../adr/008-trail-single-source-knowledge.md)  
**Status legacy cleanup:** UI + API + `doc-store` **verwijderd** in repo (18 nov 2026). Backup: `docs/archive/2026-11-18-trail-docs-backup/`.

## Belangrijke bevinding

In **deze repo is geen tweerichtings-sync tussen Trail en `docs/` in de product-repo geïmplementeerd.** Wat wél bestaat is een **lokale kennislaag**:

- Pad: **`.trail/docs/`** (markdown + YAML frontmatter)
- CRUD via **`@trail-pm/ui`** API (`packages/ui/server/api.ts`)
- Core: **`packages/cli/src/core/doc-store.ts`** (geëxporteerd via `lib.ts`)
- Taken kunnen **`refs`** hebben die naar `.trail/docs/...` wijzen (`TaskDrawer`, `doc-ref.ts`)

Dat is conceptueel hetzelfde productprobleem (kennis in git-bestanden naast Trail) maar dan onder `.trail/` i.p.v. repo-root `docs/`. Opschonen = legacy **Documents**-feature + specs die repo-`docs/` sync beloven.

**Wel intact laten:** `fullSync` / `pullSync` voor **GitHub Issues** (`packages/cli/src/core/sync.ts`), niet voor markdown-docs.

## Tabel per laag

| Bestand / gebied | Wat het doet | Actie |
| --- | --- | --- |
| `packages/cli/src/core/doc-store.ts` | List/read/write/update/delete `.trail/docs` | **Verwijderen** (na UI); geen issue-sync deps |
| `packages/cli/src/core/doc-frontmatter.ts` | YAML frontmatter voor trail-docs | **Verwijderen** met doc-store |
| `packages/cli/src/core/doc-store.test.ts` | Tests doc-store | **Verwijderen** |
| `packages/cli/src/core/doc-frontmatter.test.ts` | Tests frontmatter | **Verwijderen** |
| `packages/cli/src/core/paths.ts` → `docsDir` | `.trail/docs` pad | **Aanpassen** — veld weg of legacy alias |
| `packages/cli/src/lib.ts` | Exporteert doc-store API naar UI | **Aanpassen** — exports strippen |
| `packages/ui/server/api.ts` | REST `/api/docs/*` | **Verwijderen** endpoints + imports |
| `packages/ui/server/ensure-cli-built.ts` | Vereist `listDocs` in lib build | **Aanpassen** |
| `packages/ui/src/components/docs/*` | DocumentsPage, tree, editor | **Verwijderen** |
| `packages/ui/src/lib/doc-ref.ts` | Normaliseert doc-paden voor task refs | **Verwijderen** of vervangen door Trail-ids (desktop) |
| `packages/ui/src/App.tsx` | Docs view, `useDocs` hooks, selectedDocPath | **Aanpassen** — documents flow eruit |
| `packages/ui/src/components/layout/Sidebar.tsx` | DocSidebarTree | **Aanpassen** |
| `packages/ui/src/components/layout/AppLayout.tsx` | Doc navigatie in layout | **Aanpassen** |
| `packages/ui/src/components/task/TaskDrawer.tsx` | Linked documents uit `refs` | **Aanpassen** — refs UI of nieuw model |
| `packages/ui/src/api/client.ts` + `hooks.ts` | `useDocs`, create/patch/delete doc | **Verwijderen** doc hooks |
| `packages/ui/src/types/document.ts` | TrailDocument types | **Verwijderen** |
| `packages/cli/src/schemas/task.ts` → `refs` | Optionele doc-koppelingen op taken | **Aanpassen** — behouden voor GitHub paths of migreren; geen `.trail/docs` |
| `.trail/docs/` (repo data) | Joey's pagina's (bijv. `untitled.md`) | **Migreren** naar Trail desktop store vóór drop; backup |
| `packages/cli/src/mcp/run-mcp-server.ts` | Alleen issue/task tools | **Behouden** — geen doc-sync MCP |
| `docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md` | Docs scherm, `docs/` sync, Edit doc → PR | **Aanpassen** — ADR-008 (Trail-only kennis) |
| `docs/superpowers/specs/2026-04-10-trail-design.md` | `refs`, `docs/` links in tasks | **Aanpassen** — legacy label; geen nieuwe features |
| `docs/superpowers/specs/2026-04-10-trail-ui-design.md` | Linked doc paths in UI | **Aanpassen** of archiveren met legacy tag |
| `README.md` (root) | Task sync + UI poll | **Behouden** issue-sync copy; geen docs-sync claims (nu ook niet) |
| `apps/desktop`, `packages/core`, `packages/mcp` | Nog geen docs-implementatie | **Implementeren** volgens ADR-008 (SQLite, MCP `search_docs`) |

## Gedeelde code (niet breken)

| Module | Gebruikt door issues? |
| --- | --- |
| `sync.ts`, `github-client.ts`, `github-mapper.ts` | Ja — **niet aanraken** |
| `paths.ts`, `task-store.ts`, `config-update.ts` | Ja — alleen `docsDir` ont koppelen |
| `doc-store.ts` | Alleen UI — veilig te verwijderen na stap 2 |

## Voorgestelde PR-volgorde (legacy track)

| Stap | Status |
| --- | --- |
| ADR-008 + cleanup briefing + design index | ✅ |
| Desktop briefing ADR-008 alignment | ✅ |
| UI: Documents verwijderd | ✅ |
| API `/api/docs` verwijderd | ✅ |
| CLI `doc-store` verwijderd | ✅ |
| Backup `docs/archive/2026-11-18-trail-docs-backup/` | ✅ |
| `.trail/docs` deprecated + README | ✅ |
| Desktop: SQLite knowledge + Docs screen | 🔜 |
| Optioneel: eenrichtings-export `docs/trail/` | Later |

## Zoektermen voor eindcontrole

`doc-store`, `.trail/docs`, `/api/docs`, `useDocs`, `DocumentsPage`, `sync.*docs`, `docs folder`, `Edit doc`, `search_docs` (alleen waar repo-sync bedoeld is).