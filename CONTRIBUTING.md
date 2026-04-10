# Contributing to Trail

## Getting started

1. Fork the repo
2. Clone your fork
3. `npm install` at the root
4. `npm test` to verify setup
5. Create a branch for your work

## Branch naming

| Type | Format | Example |
|---|---|---|
| Feature | `feat/<issue>-<slug>` | `feat/12-sync-engine` |
| Bug fix | `fix/<issue>-<slug>` | `fix/35-conflict-resolution` |
| Chore | `chore/<slug>` | `chore/update-deps` |
| Docs | `docs/<slug>` | `docs/readme-commands` |

## Commit messages

- Use imperative mood: "Add feature" not "Added feature"
- Keep subject under 72 characters
- Reference GitHub Issues when relevant: `feat(sync): add pull logic (#12)`

## Pull requests

- Reference the GitHub Issue in the PR description
- CI must pass (typecheck + tests)
- One logical change per PR

## Code standards

- TypeScript strict mode — no `any`
- Zod for all data validation
- Co-located test files (`*.test.ts` next to source)
- Run `npm test && npm run typecheck` before pushing

## Project layout

See `AGENTS.md` for the full project structure and patterns.
