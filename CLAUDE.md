# Trail — Claude Code Instructions

Read `AGENTS.md` for the full instructions. This file adds Claude-specific guidance.

## Quick reference

- Spec: `docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md`
- Design HTML: `design/desktop-dashboard/v1.html`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Legacy build: `npm run build`
- Desktop dev: `npm run desktop:dev`

## Claude-specific

- Use `npm test` before every commit
- Use `npm run typecheck` to catch type errors
- Desktop code: `apps/desktop/`, shared logic in `packages/core`, `packages/ipc`
- Legacy CLI: `packages/cli/src/` only when fixing the parallel track
- Follow the commit message conventions in `CONTRIBUTING.md`