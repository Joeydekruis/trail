# Trail Desktop — design index

**Date:** 2026-11-18  
**Status:** approved for implementation planning

## Canonical sources

1. **Bouwbriefing (full):** [2026-11-18-trail-desktop-briefing.md](./2026-11-18-trail-desktop-briefing.md)
2. **Prestaties en buildgrootte:** [2026-11-18-trail-desktop-performance-briefing.md](./2026-11-18-trail-desktop-performance-briefing.md) — CI-budgets, opstart, runtime; geldt naast de bouwbriefing vanaf fase 0
3. **Visual reference:** [design/desktop-dashboard/v1.html](../../../design/desktop-dashboard/v1.html) (14 screens, dark)
4. **Pivot ADR:** [ADR-007](../../adr/007-electron-desktop-pivot.md)

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

## Performance and reliability

Harde doelen (installergrootte, bundle gzip, koude start, geheugen, polling) staan in de [prestatiebriefing](./2026-11-18-trail-desktop-performance-briefing.md). Welke MVP-fase welke eisen introduceert: tabel **Koppeling aan MVP-fasering** in dat document.

Acceptatiecriteria in de bouwbriefing blijven leidend voor productgedrag; prestatie-acceptatiecriteria vullen die aan (o.a. CI faalt boven bundle-budget, geen wit scherm, differential updates).

## Next implementation step

**Fase 0:** [2026-11-18-trail-desktop-phase-0.md](../plans/2026-11-18-trail-desktop-phase-0.md) — signing smoke test, app chrome, onboarding placeholder, **plus** electron-builder/size-limit CI vanaf de eerste release build.