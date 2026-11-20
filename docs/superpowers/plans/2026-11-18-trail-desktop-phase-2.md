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