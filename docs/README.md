# Trail documentation

**Current product:** **[Trail Desktop briefing](superpowers/specs/2026-11-18-trail-desktop-briefing.md)** · [design index](superpowers/specs/2026-11-18-trail-desktop-design.md) · [ADR-007](adr/007-electron-desktop-pivot.md)

**Legacy CLI/UI:** [2026-04-10-trail-design.md](superpowers/specs/2026-04-10-trail-design.md) · [legacy-cli-ui.md](legacy-cli-ui.md)

For day-to-day CLI usage, see the repository **[README.md](../README.md)** (installation, authentication, and full command reference).

---

## Specifications (`superpowers/specs/`)

| Document | Description |
| --- | --- |
| [2026-11-18-trail-desktop-briefing.md](superpowers/specs/2026-11-18-trail-desktop-briefing.md) | Electron desktop — canonical briefing |
| [2026-11-18-trail-desktop-design.md](superpowers/specs/2026-11-18-trail-desktop-design.md) | Desktop pivot index + repo map |
| [2026-04-10-trail-design.md](superpowers/specs/2026-04-10-trail-design.md) | Legacy CLI + JSON tasks |

---

## Implementation plans (`superpowers/plans/`)

| Document | Description |
| --- | --- |
| [2026-04-10-repo-scaffolding.md](superpowers/plans/2026-04-10-repo-scaffolding.md) | Repository and package scaffolding |
| [2026-04-10-mvp-a-cli-sync.md](superpowers/plans/2026-04-10-mvp-a-cli-sync.md) | MVP A — CLI and sync |
| [2026-04-10-mvp-b-rich-tasks-mcp.md](superpowers/plans/2026-04-10-mvp-b-rich-tasks-mcp.md) | MVP B — Drafts, deps, graph, context, MCP |

---

## Architectural Decision Records (`adr/`)

| ADR | Title |
| --- | --- |
| [001-typescript-node.md](adr/001-typescript-node.md) | TypeScript on Node.js, tsup, strict mode |
| [002-json-task-format.md](adr/002-json-task-format.md) | JSON task files validated with Zod |
| [003-github-issues-source-of-truth.md](adr/003-github-issues-source-of-truth.md) | GitHub Issues as remote source of truth |
| [004-two-package-monorepo.md](adr/004-two-package-monorepo.md) | CLI + UI packages, npm workspaces |
| [005-sync-ownership-model.md](adr/005-sync-ownership-model.md) | Field ownership and conflict resolution |
| [006-testing-strategy.md](adr/006-testing-strategy.md) | Vitest, co-located tests |
| [007-electron-desktop-pivot.md](adr/007-electron-desktop-pivot.md) | Electron desktop as primary product |
| [008-trail-single-source-knowledge.md](adr/008-trail-single-source-knowledge.md) | No repo docs two-way sync; Trail holds knowledge |

New decisions can follow [adr/000-template.md](adr/000-template.md).
