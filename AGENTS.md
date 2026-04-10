# Trail — Agent Instructions

## What is this project?

Trail (Task & Repository AI Layer) is a GitHub-native AI project management CLI.
TypeScript, Node.js, npm workspaces monorepo.

Spec: `docs/superpowers/specs/2026-04-10-trail-design.md`

CLI installation, commands, and MCP: [README.md](README.md).

## Project structure

```
packages/cli/src/cli/        — CLI command definitions (thin wrappers)
packages/cli/src/core/       — Core library (sync engine, GitHub client, compiler)
packages/cli/src/schemas/    — Zod schemas (single source of truth for all data shapes)
packages/ui/                 — React roadmap UI (separate package, MVP C)
docs/adr/                    — Architectural Decision Records
docs/superpowers/specs/      — Design specifications
docs/superpowers/plans/      — Implementation plans
```

## Before you start

1. Read `docs/superpowers/specs/2026-04-10-trail-design.md` for the full design
2. Read `docs/adr/` for architecture decisions
3. Run `npm install` at the repo root
4. Run `npm test` to verify everything passes
5. Run `npm run typecheck` to verify types

## How to make changes

- Branch from main: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<slug>`
- One logical change per commit
- Commit messages: imperative mood, explain why not just what
- Every new function gets at least one test
- Run `npm test && npm run typecheck` before committing

## Key patterns

- Zod schemas in `src/schemas/` are the single source of truth for all data shapes
- Core library (`src/core/`) exports pure functions. CLI commands are thin wrappers.
- GitHub API calls go through `src/core/github-client.ts` — nowhere else
- Errors are typed. Never throw untyped strings.
- JSON is the task file format. No YAML.
- All file I/O happens in core modules, never in CLI command handlers

## What NOT to do

- Don't add dependencies without justification
- Don't put business logic in CLI command handlers
- Don't bypass Zod validation
- Don't store secrets or tokens in any file
- Don't use `any` — use `unknown` and narrow
- Don't skip tests. Every feature ships with tests.
