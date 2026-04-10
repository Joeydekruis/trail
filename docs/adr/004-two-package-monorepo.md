# ADR-004: Two-package monorepo

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail has a CLI/core library and an optional UI. Should they be in one package or separate?

## Decision

Two packages in an npm workspaces monorepo:
- `packages/cli` — CLI + core library (published as `@trail-pm/cli`)
- `packages/ui` — React roadmap UI (published as `@trail-pm/ui`, opt-in)

No Turborepo or Nx. Plain npm workspaces.

## Consequences

- CLI users don't download React/Vite. UI is opt-in.
- npm workspaces is zero-config — no extra tooling.
- Both packages share the repo, CI, and release process.
- Core logic stays in the CLI package. If extraction is needed later, it's a straightforward split.
