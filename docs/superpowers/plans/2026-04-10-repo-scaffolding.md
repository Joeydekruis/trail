# Repo Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the monorepo structure, contributor experience files, CI/CD pipelines, and foundational ADRs so that any developer (human or AI) can start building Trail.

**Architecture:** Two-package npm workspace monorepo. `packages/cli` holds CLI + core library. `packages/ui` is a placeholder. Root has contributor files, CI workflows, and docs.

**Tech Stack:** TypeScript (strict), Node.js, npm workspaces, tsup (build), Vitest (test), GitHub Actions (CI/CD)

**Spec:** `docs/superpowers/specs/2026-04-10-trail-design.md`

---

### Task 1: Root workspace and monorepo skeleton

**Files:**
- Create: `package.json` (workspace root — replace existing)
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/tsup.config.ts`
- Create: `packages/cli/src/index.ts`
- Create: `packages/ui/package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create root `package.json` with workspaces**

```json
{
  "name": "trail-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspace=packages/cli",
    "test": "npm run test --workspace=packages/cli",
    "typecheck": "npm run typecheck --workspace=packages/cli",
    "lint": "npm run lint --workspace=packages/cli"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/cli/package.json`**

```json
{
  "name": "@trail-pm/cli",
  "version": "0.0.1",
  "description": "GitHub-native AI project management CLI",
  "type": "module",
  "bin": {
    "trail": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "commander": "^13.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  },
  "keywords": ["trail", "project-management", "github", "ai", "cli"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/joeydekruis/trail.git",
    "directory": "packages/cli"
  }
}
```

- [ ] **Step 3: Create `packages/cli/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] **Step 4: Create `packages/cli/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node18",
  banner: {
    js: "#!/usr/bin/env node",
  },
});
```

- [ ] **Step 5: Create `packages/cli/src/index.ts` (placeholder)**

```typescript
console.log("trail v0.0.1");
```

- [ ] **Step 6: Create `packages/ui/package.json` (placeholder)**

```json
{
  "name": "@trail-pm/ui",
  "version": "0.0.1",
  "private": true,
  "description": "Trail local roadmap UI (coming in MVP C)"
}
```

- [ ] **Step 7: Update `.gitignore`**

Add to the existing `.gitignore`:

```
# Trail build artifacts
dist/

# Trail local data
.trail/snapshot.json
.trail/export/
.trail/*.tmp
```

- [ ] **Step 8: Install dependencies and verify**

Run:
```bash
cd /Users/joeydekruis/Documents/GitHub/trail
npm install
```
Expected: `node_modules` created, no errors.

Run:
```bash
npm run build
```
Expected: `packages/cli/dist/index.js` created with shebang.

Run:
```bash
node packages/cli/dist/index.js
```
Expected: `trail v0.0.1` printed.

- [ ] **Step 9: Commit**

```bash
git add package.json packages/ .gitignore
git commit -m "chore: scaffold monorepo with cli and ui packages"
```

---

### Task 2: TypeScript and Vitest verification

**Files:**
- Create: `packages/cli/src/schemas/task.ts`
- Create: `packages/cli/src/schemas/task.test.ts`

- [ ] **Step 1: Create a minimal Zod schema to validate the toolchain**

Create `packages/cli/src/schemas/task.ts`:

```typescript
import { z } from "zod";

export const TaskStatusSchema = z.enum([
  "draft",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
```

- [ ] **Step 2: Write a test for it**

Create `packages/cli/src/schemas/task.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { TaskStatusSchema } from "./task.js";

describe("TaskStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(TaskStatusSchema.parse("draft")).toBe("draft");
    expect(TaskStatusSchema.parse("todo")).toBe("todo");
    expect(TaskStatusSchema.parse("in_progress")).toBe("in_progress");
    expect(TaskStatusSchema.parse("done")).toBe("done");
  });

  it("rejects invalid statuses", () => {
    expect(() => TaskStatusSchema.parse("invalid")).toThrow();
    expect(() => TaskStatusSchema.parse("")).toThrow();
    expect(() => TaskStatusSchema.parse(123)).toThrow();
  });
});
```

- [ ] **Step 3: Run tests**

Run:
```bash
npm test
```
Expected: 2 tests pass.

- [ ] **Step 4: Run typecheck**

Run:
```bash
npm run typecheck
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/schemas/
git commit -m "chore: verify toolchain with minimal schema and test"
```

---

### Task 3: Contributor files

**Files:**
- Create: `AGENTS.md`
- Create: `CLAUDE.md`
- Create: `CONTRIBUTING.md`
- Modify: `README.md`

- [ ] **Step 1: Create `AGENTS.md`**

```markdown
# Trail — Agent Instructions

## What is this project?

Trail (Task & Repository AI Layer) is a GitHub-native AI project management CLI.
TypeScript, Node.js, npm workspaces monorepo.

Spec: `docs/superpowers/specs/2026-04-10-trail-design.md`

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
```

- [ ] **Step 2: Create `CLAUDE.md`**

```markdown
# Trail — Claude Code Instructions

Read `AGENTS.md` for the full instructions. This file adds Claude-specific guidance.

## Quick reference

- Spec: `docs/superpowers/specs/2026-04-10-trail-design.md`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Claude-specific

- Use `npm test` before every commit
- Use `npm run typecheck` to catch type errors
- All code goes in `packages/cli/src/` — this is a monorepo
- Follow the commit message conventions in `CONTRIBUTING.md`
```

- [ ] **Step 3: Create `CONTRIBUTING.md`**

```markdown
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
```

- [ ] **Step 4: Update `README.md`**

Replace the current README with an updated version that reflects the actual project state:

```markdown
# Trail

> **T**ask & **R**epository **AI** **L**ayer
> A GitHub-native AI project management CLI.

---

## What is Trail?

Trail syncs with GitHub Issues, stores enriched task data as JSON files in your repo, and gives you a CLI + optional local UI to manage everything.

- **GitHub Issues is the source of truth** — no separate database, no backend
- **AI-first** — tasks are structured for Cursor, Claude, and other AI agents
- **Minimal** — two runtime dependencies, no Dolt, no Docker
- **Fast** — local JSON files, instant reads, compiled snapshots

## Status

**In development.** See the [design spec](docs/superpowers/specs/2026-04-10-trail-design.md) for the full vision.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build
```

## Project structure

```
packages/cli/     — CLI + core library (sync engine, schemas, compiler)
packages/ui/      — Local roadmap UI (opt-in, coming later)
docs/adr/         — Architectural decisions
docs/superpowers/ — Design specs and implementation plans
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
```

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md CLAUDE.md CONTRIBUTING.md README.md
git commit -m "docs: add contributor files (AGENTS.md, CLAUDE.md, CONTRIBUTING.md, README)"
```

---

### Task 4: Cursor and Claude configuration

**Files:**
- Create: `.cursor/rules/00-project.mdc`
- Create: `.cursor/rules/01-contributing.mdc`
- Create: `.cursor/rules/02-code-standards.mdc`
- Create: `.cursor/rules/03-testing.mdc`
- Create: `.cursor/rules/04-architecture.mdc`
- Remove: existing `.cursor/rules/00-workflow.mdc` through `09-git-hygiene.mdc`
- Create: `.claude/settings.json`
- Modify: `.cursor/settings.json`

- [ ] **Step 1: Remove old Cursor rules**

Delete all existing files in `.cursor/rules/`:
- `00-workflow.mdc`
- `01-architecture.mdc`
- `02-documentation.mdc`
- `03-testing.mdc`
- `04-observability.mdc`
- `05-security.mdc`
- `06-data-migrations.mdc`
- `07-code-quality.mdc`
- `08-communication.mdc`
- `09-git-hygiene.mdc`

- [ ] **Step 2: Create `.cursor/rules/00-project.mdc`**

```markdown
# Trail project context

Trail is a GitHub-native AI project management CLI. TypeScript + Node.js.

## Key decisions (see docs/adr/ for full details)

- GitHub Issues is the remote source of truth (no GitHub Projects)
- Local task files are JSON, validated with Zod
- Two-package monorepo: `packages/cli` (CLI + core) and `packages/ui` (opt-in)
- Sync engine has an ownership model: GitHub owns some fields, local owns others
- Minimal dependencies: zod, commander (runtime); tsup, vitest (dev)

## Spec

The full design spec is at `docs/superpowers/specs/2026-04-10-trail-design.md`. Read it before making architectural decisions.

## Quick commands

- `npm test` — run all tests
- `npm run typecheck` — check types
- `npm run build` — build CLI
```

- [ ] **Step 3: Create `.cursor/rules/01-contributing.mdc`**

```markdown
# Contributing rules

## Branches

Branch from main. Name format: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<slug>`.

## Commits

- Imperative mood: "Add feature" not "Added feature"
- One logical change per commit
- Reference GitHub Issues: `feat(sync): add pull logic (#12)`

## Pull requests

- Reference the GitHub Issue
- CI must pass (typecheck + tests)
- No direct commits to main after MVP bootstrap
```

- [ ] **Step 4: Create `.cursor/rules/02-code-standards.mdc`**

```markdown
# Code standards

## TypeScript

- Strict mode. No `any` — use `unknown` and narrow.
- Zod schemas are the single source of truth for all data shapes.
- Typed errors. Never throw bare strings.
- Prefer `const` over `let`. Never use `var`.

## Architecture

- Core library in `packages/cli/src/core/` exports pure functions.
- CLI commands in `packages/cli/src/cli/commands/` are thin wrappers that call core functions.
- GitHub API calls go through `src/core/github-client.ts` only.
- All file I/O happens in core modules, never in CLI command handlers.

## Error handling

- Every function that can fail returns a typed error or throws a typed error.
- Never swallow errors silently.
- User-facing errors must include what went wrong and how to fix it.

## Dependencies

- Do not add new dependencies without justification.
- Runtime deps must be zero-dependency themselves (zod, commander).
```

- [ ] **Step 5: Create `.cursor/rules/03-testing.mdc`**

```markdown
# Testing

## Framework

Vitest. Co-located test files: `foo.ts` → `foo.test.ts`.

## What to test

- Every public function gets at least one happy-path and one error-path test.
- Every Zod schema gets validation tests (valid input, invalid input).
- Sync engine gets integration tests with mocked GitHub API responses.

## How to run

- `npm test` — run all tests once
- `npm run test:watch` — watch mode
- `npx vitest run packages/cli/src/path/file.test.ts` — run one file

## Rules

- Tests must be deterministic. No time-dependent assertions.
- No network calls in unit tests. Mock external APIs.
- Test the behavior, not the implementation.
```

- [ ] **Step 6: Create `.cursor/rules/04-architecture.mdc`**

```markdown
# Architecture

## Package boundaries

| Package | Responsibility | Dependencies |
|---|---|---|
| `packages/cli` | CLI commands + core library | zod, commander |
| `packages/ui` | React roadmap UI (future) | react, vite |

The CLI package has this internal structure:

```
src/
├── cli/           # CLI entry point and command definitions (thin wrappers)
│   ├── index.ts
│   └── commands/
├── core/          # Business logic (sync engine, GitHub client, compiler, task store)
├── schemas/       # Zod schemas (single source of truth for all data shapes)
└── index.ts       # Package entry point
```

## Data flow

```
GitHub Issues ←→ sync engine ←→ .trail/tasks/*.json → compiler → snapshot.json → UI
```

## Key rules

- Schemas define the contract. Core implements the logic. CLI wires it together.
- Core functions are pure where possible. Side effects (file I/O, network) are explicit.
- The GitHub client is the only module that makes network requests.
- The task store is the only module that reads/writes `.trail/tasks/` files.
```

- [ ] **Step 7: Create `.claude/settings.json`**

```json
{
  "permissions": {
    "allow": [
      "npm test",
      "npm run typecheck",
      "npm run build",
      "npx vitest"
    ]
  }
}
```

- [ ] **Step 8: Update `.cursor/settings.json`**

Replace with minimal settings appropriate for the project:

```json
{
  "version": 1
}
```

- [ ] **Step 9: Commit**

```bash
git add .cursor/ .claude/ 
git commit -m "chore: replace Cursor rules with Trail-specific contributor config

Replace 10 generic workflow rules with 5 focused, standalone rules
tailored to Trail's architecture. Add Claude Code settings."
```

---

### Task 5: CI/CD workflows

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          registry-url: https://registry.npmjs.org

      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

      - name: Publish CLI package
        run: npm publish --workspace=packages/cli --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add CI and release workflows

CI runs typecheck + test + build on Node 18/20/22 for every push and PR.
Release workflow publishes to npm when a GitHub Release is created."
```

---

### Task 6: Foundational ADRs

**Files:**
- Create: `docs/adr/000-template.md`
- Create: `docs/adr/001-typescript-node.md`
- Create: `docs/adr/002-json-task-format.md`
- Create: `docs/adr/003-github-issues-source-of-truth.md`
- Create: `docs/adr/004-two-package-monorepo.md`
- Create: `docs/adr/005-sync-ownership-model.md`
- Create: `docs/adr/006-testing-strategy.md`

- [ ] **Step 1: Create `docs/adr/000-template.md`**

```markdown
# ADR-NNN: [Title]

**Date:** YYYY-MM-DD
**Status:** proposed | accepted | superseded by ADR-NNN

## Context

What is the problem or decision we need to make?

## Decision

What did we decide?

## Consequences

What are the trade-offs? What becomes easier? What becomes harder?
```

- [ ] **Step 2: Create `docs/adr/001-typescript-node.md`**

```markdown
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
```

- [ ] **Step 3: Create `docs/adr/002-json-task-format.md`**

```markdown
# ADR-002: JSON for task files

**Date:** 2026-04-10
**Status:** accepted

## Context

Local task files in `.trail/tasks/` need a format that is machine-readable, AI-friendly, and validates reliably.

Considered: YAML, JSON, JSONC.

## Decision

JSON. Validated with Zod schemas on every read and write.

## Consequences

- Zero ambiguity in parsing. No whitespace-sensitivity issues.
- Every LLM produces valid JSON more reliably than YAML.
- Zod validation is trivial — `schema.parse(JSON.parse(file))`.
- No YAML parser dependency needed.
- Harder to hand-edit than YAML, but users interact through CLI/UI, not raw files.
- GitHub API returns JSON — sync has zero format conversion.
```

- [ ] **Step 4: Create `docs/adr/003-github-issues-source-of-truth.md`**

```markdown
# ADR-003: GitHub Issues as remote source of truth

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail needs a remote source of truth for project tasks. Options: GitHub Issues, GitHub Projects, or a custom backend.

## Decision

GitHub Issues only. No GitHub Projects. No custom backend.

## Consequences

- One sync target — simpler sync engine, fewer API calls.
- GitHub Projects V2 API is brittle and poorly documented — avoided.
- Local task files store what GitHub Issues can't: dependencies, AI context, test strategy.
- The sync engine has a clear ownership model: GitHub owns some fields, local owns others.
- No real-time collaboration — sync is poll-based or on-demand.
```

- [ ] **Step 5: Create `docs/adr/004-two-package-monorepo.md`**

```markdown
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
```

- [ ] **Step 6: Create `docs/adr/005-sync-ownership-model.md`**

```markdown
# ADR-005: Sync field ownership model

**Date:** 2026-04-10
**Status:** accepted

## Context

When syncing between GitHub Issues and local task files, both sides may change the same task. We need deterministic conflict resolution.

## Decision

Every field has exactly one owner (GitHub, Local, or Shared):

- **GitHub-owned** (title, description, labels, assignee, milestone): GitHub always wins.
- **Local-owned** (priority, dependencies, AI context, refs, branch, estimate): Local always wins.
- **Shared** (status, due_date): Last-write-wins by timestamp. Ambiguous conflicts (within 5s) are flagged for manual resolution.

## Consequences

- Most syncs are conflict-free because fields don't overlap.
- The "shared" category is small (2 fields), minimizing conflict surface.
- Users must resolve genuine conflicts manually — Trail never guesses.
- The ownership model is documented and predictable.
```

- [ ] **Step 7: Create `docs/adr/006-testing-strategy.md`**

```markdown
# ADR-006: Testing strategy

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail needs automated tests to ensure reliability. Need to choose a framework and approach.

## Decision

- **Framework:** Vitest
- **Test location:** Co-located (`foo.ts` → `foo.test.ts`)
- **Approach:** Unit tests for schemas and core functions. Integration tests for sync engine with mocked GitHub API.
- **Coverage:** Critical paths required. No numeric target.

## Consequences

- Vitest is fast, TypeScript-native, and has built-in mocking.
- Co-located tests are easy to find and maintain.
- Mocking the GitHub API avoids network calls in tests but requires maintaining mock fixtures.
- No E2E tests in v1 — added when the CLI is stable.
```

- [ ] **Step 8: Commit**

```bash
git add docs/adr/
git commit -m "docs: add foundational ADRs (001-006)

Records decisions on TypeScript/Node, JSON format, GitHub Issues as
source of truth, monorepo structure, sync ownership model, and testing."
```

---

### Task 7: Clean up obsolete docs

**Files:**
- Remove: `docs/plans/PROJECT.md` (superseded by design spec)
- Remove: `docs/plans/.gitkeep`
- Remove: `docs/features/000-template.md` (will be recreated when needed)
- Remove: `docs/README.md` (replaced by root README + ADRs)

- [ ] **Step 1: Remove superseded files**

```bash
git rm docs/plans/PROJECT.md docs/plans/.gitkeep docs/features/000-template.md docs/README.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove superseded docs

PROJECT.md superseded by docs/superpowers/specs/2026-04-10-trail-design.md.
Feature template and docs README will be recreated when needed."
```

---

### Task 8: Verify everything works end-to-end

- [ ] **Step 1: Clean install**

```bash
rm -rf node_modules packages/cli/node_modules
npm install
```
Expected: Clean install, no warnings about peer deps.

- [ ] **Step 2: Run all checks**

```bash
npm run typecheck && npm test && npm run build
```
Expected: All pass.

- [ ] **Step 3: Verify built CLI runs**

```bash
node packages/cli/dist/index.js
```
Expected: `trail v0.0.1`

- [ ] **Step 4: Verify file structure**

```bash
ls -la packages/cli/src/schemas/task.ts
ls -la packages/cli/src/schemas/task.test.ts
ls -la AGENTS.md CLAUDE.md CONTRIBUTING.md
ls -la .cursor/rules/00-project.mdc
ls -la .claude/settings.json
ls -la .github/workflows/ci.yml
ls -la docs/adr/001-typescript-node.md
```
Expected: All files exist.

- [ ] **Step 5: Final commit if any uncommitted changes remain**

```bash
git status
```
Expected: Clean working tree. If not, commit remaining changes.
