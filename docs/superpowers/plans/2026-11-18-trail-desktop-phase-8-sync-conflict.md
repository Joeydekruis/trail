# Trail Desktop — fase 8 (sync conflict resolve) — gestart

**Goal:** Detect GitHub vs Trail issue drift on sync and resolve per field with GitHub push.

**Status:**

- [x] SQLite `issue_sync_conflicts` + merge on sync (state, board column, labels)
- [x] IPC list/resolve + push state, Projects status, labels to GitHub
- [x] Conflict banner + Resolve sync conflict modal
- [ ] Assignee field (not in issue cache yet)
- [x] Per-card sync status on board (`synced` / `conflict`; `pending` reserved)