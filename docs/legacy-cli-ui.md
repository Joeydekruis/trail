# Legacy CLI + web UI track

**Status:** maintained in parallel until Trail Desktop MVP; **no new features** on this track.

| Package | NPM name | Role |
| --- | --- | --- |
| `packages/cli` | `@trail-pm/cli` | JSON tasks under `.trail/`, GitHub issue sync, MCP (stdio) |
| `packages/ui` | `@trail-pm/ui` | Local Vite roadmap UI (kanban, tasks — **no Documents feature**) |

Removed 2026-11-18 (ADR-008): `.trail/docs/` editor, `/api/docs`, `doc-store` in CLI.

**Current product direction:** [Trail Desktop briefing](superpowers/specs/2026-11-18-trail-desktop-briefing.md) · [ADR-007](../adr/007-electron-desktop-pivot.md) · [ADR-008](../adr/008-trail-single-source-knowledge.md)

Commands: `npm test`, `npm run ui:dev`, `npm run desktop:dev` at repo root.