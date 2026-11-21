# Trail Desktop — fase 1 (workspace & cache) — gestart

**Goal:** Workspaces uit SQLite-cache bij start; accent-wissel; IPC-contract; uitgestelde achtergronddiensten.

**Status (eerste slice):**

- [x] `WorkspaceStore` in `@trail/core` + demo-seed (Trail, Loupe, Dockyrd)
- [x] IPC `workspace.list` / `workspace.switch` (Zod)
- [x] SQLite in main (`userData/trail.sqlite`, WAL)
- [x] Renderer: strip, accent CSS-vars, Cmd/Ctrl+1–3
- [x] Deferred startup stub (sync, runner, MCP, updates na first paint)
- [x] GitHub koppeling (PAT + keychain) + workspace-records met repository
- [x] Onboarding schrijft eerste gekoppelde workspace naar cache
- [x] `@electron/rebuild` in CI/release via `bootstrap:desktop`

**Native module:** `better-sqlite3` zit op `@trail/desktop`. Lokaal op Windows: Node **22** (repo engines) en prebuild, of MSVC build tools. CI gebruikt Node 22 op ubuntu/windows runners.