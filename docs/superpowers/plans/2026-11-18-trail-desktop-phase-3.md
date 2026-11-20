# Trail Desktop — fase 3 (live loop) — gestart

**Goal:** Trail blijft zelf actueel terwijl de app open is; Settings-velden uit de briefing worden echt; New task wordt GitHub-backed.

**Status:**

- [x] Background sync voor actieve workspace (instelbaar interval, default 60s)
- [x] Settings → GitHub: sync-interval + board mapping
- [ ] New task → draft + **Create on GitHub** (REST issue + priority labels)
- [ ] Worktrees (agent isolation) — stub blijft in UI
- [ ] OAuth i.p.v. PAT (later)

**Notities:** Background sync draait in main na deferred startup; renderer krijgt `trail.backgroundSync` events voor statusbalk + board refresh.