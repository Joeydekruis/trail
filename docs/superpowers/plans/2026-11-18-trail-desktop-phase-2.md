# Trail Desktop — fase 2 (GitHub board) — gestart

**Goal:** Issues uit GitHub in SQLite-cache; board toont echte issues na sync; Projects v2 Status volgt later.

**Status:**

- [x] `issue_cache` tabel + sync via `sync.now`
- [x] Board leest cache voor gekoppelde workspace (demo-fixture fallback)
- [x] Projects v2 Status-veld → boardkolommen (GraphQL bij sync; veld `Status`)
- [x] Issue-modal uit cache (titel, status, body, Open on GitHub)
- [x] Live GitHub comments in modal
- [x] Slepen tussen kolommen schrijft naar GitHub

**Notities:** Open issues landen voorlopig in **Backlog**; gesloten in **Done**. Prioriteit uit `priority:*` labels.

**Follow-up (in PR):**

- [x] Instelbare Projects **Status**-veldnaam per workspace (Settings → GitHub)
- [x] Slepen naar **Done** sluit issue; van Done weg heropent
- [x] Command palette (⌘/Ctrl+K) — live pages, worktrees, board-taken, ADR's, docs, acties