# Trail Desktop — fase 3 (live loop) — gestart

**Goal:** Trail blijft zelf actueel terwijl de app open is; Settings-velden uit de briefing worden echt; New task wordt GitHub-backed.

**Status:**

- [x] Background sync voor actieve workspace (instelbaar interval, default 60s)
- [x] Settings → GitHub: sync-interval + board mapping
- [x] New task (form) → **Create on GitHub** (REST issue + type/priority labels)
- [x] New task chat → local draft heuristics + approve + Create on GitHub
- [x] Worktrees — `git worktree add`, SQLite registry, sidebar + tab; onboarding/Settings repo path
- [x] Agent runner — utility process, `claude -p` wanneer beschikbaar; cursor-agent preview; output naar worktree chat
- [x] Agent stream via `MessagePort` (run state blijft op IPC)
- [ ] OAuth i.p.v. PAT (later)

**Notities:** Background sync draait in main na deferred startup; renderer krijgt `trail.backgroundSync` events voor statusbalk + board refresh. Interval-wijzigingen en workspace switch herstarten de timer; Settings → GitHub heeft **Sync now** + laatste sync-tijd.