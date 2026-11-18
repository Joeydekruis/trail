# Trail Desktop — fase 1 (workspace & cache) — gestart

**Goal:** Workspaces uit SQLite-cache bij start; accent-wissel; IPC-contract; uitgestelde achtergronddiensten.

**Status (eerste slice):**

- [x] `WorkspaceStore` in `@trail/core` + demo-seed (Trail, Loupe, Dockyrd)
- [x] IPC `workspace.list` / `workspace.switch` (Zod)
- [x] SQLite in main (`userData/trail.sqlite`, WAL)
- [x] Renderer: strip, accent CSS-vars, Cmd/Ctrl+1–3
- [x] Deferred startup stub (sync, runner, MCP, updates na first paint)
- [ ] GitHub koppeling + echte workspace-records
- [ ] Onboarding schrijft naar cache
- [ ] `@electron/rebuild` in release CI voor better-sqlite3

**Native module:** `better-sqlite3` zit op `@trail/desktop`. Lokaal op Windows: Node **22** (repo engines) en prebuild, of MSVC build tools. CI gebruikt Node 22 op ubuntu/windows runners.