# ADR-001: TypeScript on Node.js

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail is a CLI tool that syncs with the GitHub API and reads/writes local JSON files. We need a runtime and language that is fast, cross-platform, and has excellent GitHub API ecosystem support.

## Decision

- **Runtime:** Node.js >= 18
- **Language:** TypeScript with strict mode enabled
- **Build tool:** tsup (bundles to single ESM file)
- **Target:** ES2022

## Consequences

- TypeScript strict mode catches errors at compile time. No `any` allowed.
- tsup produces a single file with shebang — no runtime dependency resolution needed.
- Node.js 18+ gives us native `fetch`, `fs/promises`, and stable ESM support.
- Cross-platform (macOS, Linux, Windows) without platform-specific code.
