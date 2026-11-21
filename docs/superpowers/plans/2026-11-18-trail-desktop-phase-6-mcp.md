# Trail Desktop — fase 6 (MCP read) — gestart

**Goal:** Phase-1 read MCP tools against the running Trail app (SQLite cache).

**Status:**

- [x] `@trail/core` read API (`list_workspaces`, `list_tasks`, `get_task`, `list_decisions`, `get_decision`, `search_docs`, `list_open_pins`)
- [x] Loopback HTTP shim in main + `mcp-connection.json` for `trail-mcp` stdio bridge
- [x] `trail-mcp` bin (`@trail/mcp`) proxies stdio MCP to HTTP
- [x] Settings → MCP status + Cursor config snippet
- [ ] Streamable HTTP transport (SDK) for clients that prefer URL over stdio
- [x] MCP write: `create_decision` (conflict checks + optional issue block)
- [ ] MCP write: update_task_status, resolve_pin, add_task_comment
- [ ] Per-workspace MCP toggles persisted in SQLite