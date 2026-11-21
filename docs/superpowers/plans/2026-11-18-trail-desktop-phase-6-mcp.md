# Trail Desktop — fase 6 (MCP read) — gestart

**Goal:** Phase-1 read MCP tools against the running Trail app (SQLite cache).

**Status:**

- [x] `@trail/core` read API (`list_workspaces`, `list_tasks`, `get_task`, `list_decisions`, `get_decision`, `search_docs`, `list_open_pins`)
- [x] Loopback HTTP shim in main + `mcp-connection.json` for `trail-mcp` stdio bridge
- [x] `trail-mcp` bin (`@trail/mcp`) proxies stdio MCP to HTTP
- [x] Settings → MCP status + Cursor config snippet
- [x] Streamable HTTP transport (SDK) at `/mcp` for URL-based MCP clients
- [x] MCP write: `create_decision` (conflict checks + optional issue block)
- [x] MCP write: `update_task_status` (board column via GitHub Projects when linked)
- [x] MCP write: `resolve_pin` (delete pin from SQLite)
- [x] MCP write: `add_task_comment` (GitHub issue comment)
- [x] Per-workspace MCP toggles persisted in SQLite (Settings → MCP)