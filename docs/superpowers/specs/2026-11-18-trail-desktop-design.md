# Trail Desktop — design index

**Date:** 2026-11-18  
**Status:** approved for implementation planning

## Canonical sources

1. **Bouwbriefing (full):** [2026-11-18-trail-desktop-briefing.md](./2026-11-18-trail-desktop-briefing.md)
2. **Visual reference:** [design/desktop-dashboard/v1.html](../../../design/desktop-dashboard/v1.html) (14 screens, dark)
3. **Pivot ADR:** [ADR-007](../../adr/007-electron-desktop-pivot.md)

## Repo foundation (this pivot)

| Path | Purpose |
| --- | --- |
| `apps/desktop` | Electron shell (electron-vite), hardened preload stub |
| `packages/core` | Domain + sync (empty; migrate from CLI later) |
| `packages/ipc` | Zod-validated IPC channel ids and payloads |
| `packages/mcp` | Desktop MCP package (CLI MCP stays in `@trail-pm/cli`) |
| `packages/tokens` | Dark tokens → CSS variables |
| `design/` | Exported HTML design versions |

## Knowledge model (amendment 2026-11-18)

[ADR-008](../../adr/008-trail-single-source-knowledge.md) overrides parts of the desktop briefing that describe **two-way sync with repo `docs/`**. MVP knowledge (ADRs, internal docs) lives in **Trail**; agents read via MCP. Optional one-way export to `docs/trail/` is post-MVP. **Designs** in `design/` remain git-versioned as in the briefing.

Cleanup plan: [docs-sync cleanup briefing](./2026-11-18-docs-sync-cleanup-briefing.md) · [inventory](./2026-11-18-docs-sync-inventory.md).

## Legacy (unchanged until deprecation)

See [docs/legacy-cli-ui.md](../../legacy-cli-ui.md). Old spec: [2026-04-10-trail-design.md](./2026-04-10-trail-design.md).

## Next implementation step

Invoke an implementation plan for **Phase 0** from the briefing: signed build smoke test, app chrome shell, onboarding placeholder.