# Trail — Agent Instructions

## What is this project?

**Trail Desktop** is an Electron app: PM layer and orchestrator above GitHub (issues, Projects v2, ADRs, docs, designs), local agent worktrees, preview with pins, and MCP.

TypeScript monorepo. **Primary spec:** `docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md` · **Performance:** `docs/superpowers/specs/2026-11-18-trail-desktop-performance-briefing.md` · **Fase 0 plan:** `docs/superpowers/plans/2026-11-18-trail-desktop-phase-0.md`

**Legacy (parallel):** `@trail-pm/cli` + `@trail-pm/ui` — see `docs/legacy-cli-ui.md`. Do not add desktop features there.

## Project structure

```
apps/desktop/              — Electron main, preload, renderer (electron-vite)
packages/core/             — Domain, sync, git (migrate from cli over time)
packages/ipc/              — Zod IPC contracts
packages/mcp/              — Desktop MCP server
packages/tokens/           — Design tokens (CSS variables)
packages/cli/              — LEGACY CLI
packages/ui/               — LEGACY web UI
design/                    — HTML design exports
docs/adr/                  — Architectural Decision Records (see ADR-007)
docs/superpowers/specs/    — Design specifications
```

## Before you start

1. Read `docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md`
2. Read `docs/adr/007-electron-desktop-pivot.md`
3. Desktop bootstrap: Node **22** (`.nvmrc`). Close any running Electron/Trail app, then `npm run bootstrap:desktop` (not plain `npm ci` on Windows).
4. Run `npm test` (legacy CLI + new package tests)
5. Desktop dev: `npm run desktop:dev`
6. Optional before desktop UI changes: `npm run build --workspace=@trail/desktop && npm run test:e2e --workspace=@trail/desktop` (`TRAIL_E2E=1` in CI)

## How to make changes

- Branch from main: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<slug>`
- One logical change per commit
- Commit messages: imperative mood, explain why not just what
- Every new function gets at least one test
- Run `npm test && npm run typecheck` before committing; desktop PRs get `.github/workflows/desktop-ci.yml` (unit on Ubuntu, Playwright on macOS)

## Key patterns (desktop)

- Zod schemas in `packages/ipc` (and later `packages/core`) are contracts for IPC and domain data
- Renderer: no Node — only `window.trail` via `contextBridge`; import shared UI logic from `@trail/core/client`, never the full `@trail/core` barrel (Node-only code breaks Vite)
- GitHub/git/agents run in **main** or **utility** processes, not in renderer
- GitHub is source of truth for tasks; SQLite is local cache only
- Errors are typed. Never throw untyped strings.
- `.trail/config.yml` in repos (not JSON task files) for workspace config

## What NOT to do

- Don't add desktop features to `packages/cli` / legacy UI
- Don't put business logic in renderer React components without going through IPC
- Don't bypass Zod validation on IPC
- Don't store secrets or tokens in any file (use OS keychain via Electron `safeStorage`)
- Don't use `any` — use `unknown` and narrow
- Don't skip tests for new core logic