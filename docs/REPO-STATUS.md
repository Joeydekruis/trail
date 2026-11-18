# Repo status after desktop pivot (2026-11-18)

## Product direction

**Build:** [Trail Desktop](superpowers/specs/2026-11-18-trail-desktop-briefing.md) (`apps/desktop`, `packages/core`, `packages/ipc`, `packages/mcp`, `packages/tokens`).

## Still in the repo on purpose (legacy track)

| Area | Why it remains |
| --- | --- |
| `packages/cli` (`@trail-pm/cli`) | Parallel until desktop MVP; GitHub issue sync still works |
| `packages/ui` (`@trail-pm/ui`) | Parallel kanban/list UI (Documents **removed**) |
| `.trail/config.json` + scaffold | Legacy dogfooding format (`config.json`, not desktop `config.yml`) |
| `docs/superpowers/specs/2026-04-10-*.md` | Historical; labeled legacy in `docs/README.md` |
| `docs/superpowers/plans/2026-04-10-*.md` | Archived under `docs/archive/legacy-cli-plans/` |

## Removed (docs / knowledge sync)

- `doc-store`, `/api/docs`, Documents UI
- Repo or `.trail/docs` as editable knowledge (ADR-008)

## Not cleaned yet (expected next work)

- Desktop app chrome, SQLite knowledge, MCP `search_docs`
- Design HTML canvas may still show old “sync docs” copy
- Optional: stop publishing `@trail-pm/*` to npm when desktop ships
- Rename `packages/ui` → design system (name clash with legacy web UI)

## GitHub Issues

Test issues from the CLI/UI era were **closed** with a pivot comment (Nov 2026). New work should use GitHub Issues directly for tasks; Trail Desktop will sync those without local JSON long term.