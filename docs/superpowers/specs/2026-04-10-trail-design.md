# Trail — Design Specification

**Date:** 2026-04-10
**Status:** Approved
**Supersedes:** `docs/plans/PROJECT.md` (initial vision doc)

---

## 1. What Trail is

Trail (**T**ask & **R**epository **AI** **L**ayer) is a GitHub-native AI project management CLI. It syncs with GitHub Issues as the remote source of truth, stores enriched task data as JSON files in the repository, and provides a CLI + optional local UI to manage everything.

No database. No backend. No heavy dependencies. Files, git, and the GitHub API.

### Core principles

1. **GitHub Issues is the remote source of truth** — no Projects, no separate PM silo
2. **The repo is the intelligence layer** — structured task data, dependencies, and AI context live in `.trail/`
3. **No hidden state** — everything is versioned, inspectable, editable
4. **AI is a first-class citizen** — tasks are structured for context assembly and execution planning
5. **Minimal dependencies** — four runtime deps (two dev-only), no Dolt, no external database

### What Trail is not

- Not a hosted service
- Not a database
- Not a replacement for GitHub Issues (it builds on top of them)
- Not a real-time collaboration tool
- Not a Beads/Dolt-based system

---

## 2. Architecture

### Data flow

```
GitHub Issues  ←——  sync engine  ——→  .trail/tasks/*.json  (committed to git)
                                              ↓
                                      compiler step
                                              ↓
                                    .trail/snapshot.json  (gitignored, derived)
                                         ↓          ↓
                                       CLI          UI
                                         ↓
                                    AI agents (via CLI --json or MCP)
```

- Individual task JSON files are the local source files (committed to git)
- The sync engine merges GitHub Issues with local files bi-directionally
- The compiler produces a denormalized snapshot for fast reads
- The UI reads the snapshot. AI agents can read either individual tasks or the snapshot.
- The CLI reads individual files for mutations, snapshot for queries.

### Approach: sync to files, compile to snapshot

Each task is a self-contained JSON file in `.trail/tasks/`. The sync engine also produces a compiled `snapshot.json` — a single denormalized file with all tasks, resolved dependencies, computed statuses, and metadata.

The snapshot is gitignored — it's a derived artifact, never committed. Source task files are committed.

---

## 3. Directory structure

### User's repo (after `trail init`)

```
.trail/
├── config.json           # repo settings (GitHub owner/repo, sync preferences)
├── tasks/
│   ├── 047.json          # GitHub-synced task (ID = issue number)
│   ├── 048.json
│   ├── draft-a7f3.json   # local draft (not yet on GitHub)
│   └── ...
├── snapshot.json          # compiled aggregate (gitignored)
└── .gitignore             # ignores snapshot.json, export/, *.tmp
```

- `.trail/tasks/` — **committed** to git. Local source of truth.
- `.trail/snapshot.json` — **gitignored**. Derived artifact.
- `.trail/config.json` — **committed**. Repo-level settings.

### Trail source repo (this repo)

```
trail/
├── packages/
│   ├── cli/                # CLI + core library
│   │   ├── src/
│   │   │   ├── cli/        # command definitions
│   │   │   ├── core/       # sync engine, GitHub client, compiler
│   │   │   ├── schemas/    # Zod schemas
│   │   │   └── index.ts    # CLI entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui/                 # React roadmap app (opt-in)
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── .cursor/                # Cursor rules for contributors
├── .claude/                # Claude Code rules for contributors
├── AGENTS.md               # AI agent instructions
├── CLAUDE.md               # Claude Code specific instructions
├── CONTRIBUTING.md          # Human contributor guide
├── README.md               # What Trail is, command reference, quick-start
├── package.json            # workspace root (npm workspaces)
└── docs/
```

### Two-package monorepo

| Package | Contents | Published |
|---|---|---|
| `packages/cli` | CLI + core library (sync engine, schemas, compiler, GitHub client) | Yes — the npm package users install |
| `packages/ui` | React roadmap app (Vite) | Yes — opt-in add-on |

Uses npm workspaces. No Turborepo, no Nx.

---

## 4. Task schema

Every task file in `.trail/tasks/` follows this shape. Validated by Zod on every read and write.

```json
{
  "id": "047",
  "title": "Add authentication flow",
  "description": "Implement login/logout and token refresh support",
  "status": "in_progress",
  "priority": "p1",
  "type": "feature",

  "assignee": "joey",
  "labels": ["auth", "backend"],
  "milestone": "v1",

  "parent": null,
  "depends_on": ["003"],
  "blocks": ["007", "008"],

  "due_date": "2026-04-25",
  "start_date": "2026-04-12",
  "estimate": "md",

  "github": {
    "issue_number": 47,
    "synced_at": "2026-04-10T14:30:00Z",
    "url": "https://github.com/owner/repo/issues/47"
  },

  "refs": [
    { "type": "plan", "path": "docs/plans/2026-04-10-auth-design.md" },
    { "type": "feature_doc", "path": "docs/features/001-authentication.md" }
  ],

  "ai": {
    "summary": "Implement login/logout and refresh token support using JWT",
    "acceptance_criteria": [
      "User can log in with email/password",
      "User can log out",
      "Refresh token flow works transparently"
    ],
    "implementation_context": [
      "src/auth/",
      "src/api/auth.ts"
    ],
    "test_strategy": [
      "Unit tests for auth service",
      "Integration test for login flow"
    ],
    "constraints": [
      "No database schema changes in this task"
    ]
  },

  "branch": "feat/047-auth-flow",

  "created_at": "2026-04-10T10:00:00Z",
  "updated_at": "2026-04-10T14:30:00Z"
}
```

### Field reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | yes | GitHub issue number (e.g. `"047"`) or draft hash (e.g. `"draft-a7f3"`) |
| `title` | string | yes | Task title |
| `description` | string | no | Detailed description |
| `status` | enum | yes | `draft` → `todo` → `in_progress` → `in_review` → `done` → `cancelled` |
| `priority` | enum | no | `p0`, `p1`, `p2`, `p3` |
| `type` | enum | yes | `feature`, `bug`, `chore`, `epic` |
| `assignee` | string | no | GitHub username |
| `labels` | string[] | no | Arbitrary labels |
| `milestone` | string | no | Milestone name |
| `parent` | string | no | Parent task ID (for epic grouping) |
| `depends_on` | string[] | no | Task IDs this task is blocked by |
| `blocks` | string[] | no | Task IDs this task blocks |
| `due_date` | ISO date | no | Deadline |
| `start_date` | ISO date | no | Start date for timeline views |
| `estimate` | enum | no | `xs`, `sm`, `md`, `lg`, `xl` |
| `github` | object | no | `null` for drafts. Contains `issue_number`, `synced_at`, `url` |
| `refs` | array | no | Links to docs. Each entry: `{ "type": "<label>", "path": "<file path>" }`. Types are freeform. |
| `ai` | object | no | AI context: `summary`, `acceptance_criteria`, `implementation_context`, `test_strategy`, `constraints` |
| `branch` | string | no | Suggested git branch name |
| `created_at` | ISO datetime | yes | Creation timestamp |
| `updated_at` | ISO datetime | yes | Last modification timestamp |

### ID scheme

| Task type | ID format | Collision risk |
|---|---|---|
| GitHub-synced | GitHub issue number (`"047"`) | None — GitHub is the authority |
| Local draft | `"draft-<short-hash>"` | Negligible — random hash |
| Promoted draft | Becomes issue number | Draft ID replaced on promotion |

### Statuses

`draft` → `todo` → `in_progress` → `in_review` → `done` → `cancelled`

- `draft`: local only, not synced to GitHub
- `todo`: synced, ready to start
- `in_progress`: actively being worked on
- `in_review`: PR submitted, awaiting review
- `done`: completed, GitHub Issue closed
- `cancelled`: abandoned, GitHub Issue closed

---

## 5. Sync engine

### Ownership model

Every field has exactly one owner. The owner always wins during sync.

| Field | Owner | Rationale |
|---|---|---|
| `title` | GitHub | Humans edit titles on GitHub |
| `description` | GitHub | Issue body is edited on GitHub |
| `status` | Shared | Both sides can change |
| `labels` | GitHub | Managed on GitHub |
| `assignee` | GitHub | Assigned on GitHub |
| `milestone` | GitHub | Managed on GitHub |
| `due_date` | Shared | Can be set locally or via GitHub milestone |
| `priority` | Local | Maps to a GitHub label, but local is authoritative |
| `parent`, `depends_on`, `blocks` | Local | GitHub has no concept of these |
| `ai.*` | Local | Entire AI block is local-only |
| `refs` | Local | Doc links are local-only |
| `branch` | Local | Branch suggestion is local-only |
| `estimate`, `start_date` | Local | GitHub has no concept of these |

**Shared fields** use last-write-wins with timestamps. If both sides changed and timestamps are within 5 seconds, Trail flags a conflict for manual resolution.

### Sync modes

Configured during `trail init`, stored in `.trail/config.json`:

| Mode | Auto-sync on CLI commands | UI polling | GitHub required |
|---|---|---|---|
| **collaborative** | Yes — pull before reads, push after writes | Smart backoff (30s → 2min → 10min) | Yes |
| **solo** | No — only `trail sync` triggers it | Manual refresh | Yes |
| **offline** | No sync | Reads local files only | No |

### Sync operations

**Pull** (`trail sync --pull`):

1. Fetch all open issues from GitHub (+ recently closed)
2. For each issue:
   - If matching local task exists → merge GitHub-owned fields in
   - If no local task → create new task file from issue data
   - Set `synced_at` timestamp
3. For local synced tasks with no matching GitHub issue → mark as orphaned, warn user
4. Recompile `snapshot.json`

**Push** (`trail sync --push`):

1. For each local task with `status != draft`:
   - If `github.issue_number` exists → update GitHub Issue
   - If `github.issue_number` is null and `status != draft` → create GitHub Issue, store number
2. For tasks where status changed to `done` → close the GitHub Issue
3. Update `synced_at` timestamps
4. Recompile `snapshot.json`

**Full sync** (`trail sync`): Pull → detect conflicts → resolve → push → recompile

### Rate limiting

- Conditional requests with ETags (unchanged data costs zero quota)
- Pagination in batches of 100
- Delta sync: only push tasks changed since last sync
- Cache labels/milestones locally, refresh once per cycle

### Conflict resolution

| Scenario | Resolution |
|---|---|
| GitHub-owned field changed on GitHub | GitHub wins |
| Local-owned field changed locally | Local wins |
| Shared field: one side newer | Newer timestamp wins |
| Shared field: timestamps within 5s | Trail asks user |
| Local file rolled back via git | Trail detects older timestamp, asks user |
| Issue deleted on GitHub | Local task marked orphaned, not deleted |

### Error handling

| Failure | Behavior |
|---|---|
| No internet | Graceful fail. Local commands continue. |
| Token expired | Clear error with fix instructions |
| Rate limited | Auto back-off with countdown |
| Issue deleted on GitHub | Orphan warning, user decides |
| Schema validation failure | Reject with details |
| Partial sync failure | Succeed where possible, report failures |

---

## 6. CLI commands

### Setup

| Command | Description |
|---|---|
| `trail init` | Interactive setup. Asks sync preset, detects GitHub repo, creates `.trail/` |
| `trail init --with-ui` | Same + installs UI package |

### Task management

| Command | Description |
|---|---|
| `trail create "title" [--priority p1] [--label auth]` | Create a local draft task |
| `trail promote <id>` | Promote draft to GitHub Issue (immediate in collaborative mode, queued for next `trail sync` in solo mode) |
| `trail update <id> [--status X] [--assignee Y] [...]` | Update any task field |
| `trail done <id> "message"` | Close task + GitHub Issue, suggest linked commit message |

### Viewing

| Command | Description |
|---|---|
| `trail list [--status X] [--label Y] [--limit N]` | List tasks (defaults: open, max 25) |
| `trail show <id>` | Full detail of one task |
| `trail status` | Project overview (sync state, counts by status, warnings) |
| `trail next` | Highest-priority unblocked task |
| `trail graph` | Dependency graph in terminal |

### Sync

| Command | Description |
|---|---|
| `trail sync` | Full bi-directional sync |
| `trail sync --pull` | Pull-only from GitHub |
| `trail sync --push` | Push-only to GitHub |

### Dependencies

| Command | Description |
|---|---|
| `trail dep add <task> <depends-on>` | Add dependency |
| `trail dep remove <task> <depends-on>` | Remove dependency |

### AI-optimized

| Command | Description |
|---|---|
| `trail context <id>` | Compact task packet for AI consumption |

### UI

| Command | Description |
|---|---|
| `trail ui` | Start local dev server |
| `trail ui install` | Install UI package |
| `trail export` | Generate static HTML to `.trail/export/` |

### Validation

| Command | Description |
|---|---|
| `trail validate` | Validate schemas, dependency graph, GitHub references |

### Cross-cutting flags

- `--json` on all read commands for machine-readable output
- Every mutating command recompiles `snapshot.json` automatically
- In collaborative mode, every command auto-syncs

---

## 7. GitHub authentication

**Strategy:** `GITHUB_TOKEN` environment variable with `gh` CLI fallback.

Resolution order:
1. `GITHUB_TOKEN` env var (if set)
2. `gh auth token` (if `gh` is installed and authenticated)
3. Error with instructions for both options

Trail never stores tokens. No file, no cache, no keychain. Reads on demand.

Recommended token scope: `repo` (private repos) or `public_repo` (public repos).

---

## 8. Distribution

### npm package

Published to npm. Documented default is `npx trail`.

- `npx trail init` — zero-friction first use
- `npm install -g trail` — power users who want instant execution

Both work from the same npm package via the `bin` field in `package.json`.

### UI as opt-in add-on

- Default install: CLI only, no React/Vite in `node_modules`
- `trail init --with-ui` or `trail ui install` to add the UI package
- `trail ui` without the package installed tells you how to add it

### Release process

Releases are triggered by **GitHub Releases**, not raw git tags. This gives us a changelog, release notes, and downloadable artifacts in one place.

**Release workflow:**

1. A maintainer creates a **GitHub Release** via the GitHub UI or `gh release create`
2. The release tag follows semver: `v1.0.0`, `v1.1.0`, `v0.3.0-beta.1`
3. Release notes are written in the GitHub Release body (changelog for this version)
4. Creating the release triggers a **GitHub Actions workflow** that:
   - Runs the full test suite
   - Type-checks the codebase
   - Builds with tsup
   - Publishes to npm (`npm publish`)
   - Attaches build artifacts to the GitHub Release
5. If any step fails, the publish is aborted and the release is marked as failed

**GitHub Actions workflow (`.github/workflows/release.yml`):**

```
trigger:  release created (published)
    ↓
checkout code at release tag
    ↓
npm ci (install deps)
    ↓
npm run typecheck
    ↓
npm test
    ↓
npm run build (tsup)
    ↓
npm publish (to npm registry)
    ↓
attach built artifacts to GitHub Release
```

**npm authentication:** Uses an `NPM_TOKEN` stored as a GitHub Actions secret. Only the CI pipeline publishes — no human runs `npm publish` manually.

**Versioning convention:**
- `v0.x.x` — pre-1.0 development (breaking changes allowed in minor bumps)
- `v1.0.0` — first stable release
- Patch (`v1.0.1`) — bug fixes
- Minor (`v1.1.0`) — new features, backwards-compatible
- Major (`v2.0.0`) — breaking changes

**Changelog:** Each GitHub Release contains a human-written summary of what changed. For detailed history, contributors and users can browse the release list on GitHub. No separate `CHANGELOG.md` file — GitHub Releases is the single source of truth for release notes.

---

## 9. Development workflow (this repo)

### Branch strategy

**`main` is protected.** No direct commits to main except during initial MVP bootstrap.

| Phase | Direct commits to main? | Rationale |
|---|---|---|
| MVP bootstrap (initial scaffolding) | Yes | Getting the skeleton up fast, no reviewers yet |
| Post-MVP (once the project has structure) | No — PR required | All changes go through pull requests |

### Contribution flow

```
1. Pick a GitHub Issue (or create one)
2. Create a branch: feat/<issue-number>-<slug>, fix/<issue-number>-<slug>, chore/<slug>
3. Implement on the branch
4. Open a Pull Request targeting main
5. PR description references the GitHub Issue (e.g. "Closes #12")
6. CI runs: typecheck + test + lint
7. Review + approve
8. Merge (squash or merge commit — decided per-PR)
9. GitHub Issue auto-closes via the PR reference
```

### Branch naming

| Type | Format | Example |
|---|---|---|
| Feature | `feat/<issue>-<slug>` | `feat/12-sync-engine` |
| Bug fix | `fix/<issue>-<slug>` | `fix/35-conflict-resolution` |
| Chore | `chore/<slug>` | `chore/update-deps` |
| Docs | `docs/<slug>` | `docs/readme-commands` |

### Pull request requirements

- References a GitHub Issue in the description
- CI passes (typecheck, tests, lint)
- At minimum one approval (once multiple contributors exist)
- No secrets, no generated artifacts, no large binaries

### CI pipeline (`.github/workflows/ci.yml`)

Runs on every push and PR:

```
trigger: push to any branch, PR to main
    ↓
npm ci
    ↓
npm run typecheck (tsc --noEmit)
    ↓
npm test (vitest)
    ↓
npm run lint (if configured)
    ↓
report: pass / fail
```

### How development connects to releases

```
Issue #12 created
    ↓
Branch: feat/12-sync-engine
    ↓
PR opened → CI passes → reviewed → merged to main
    ↓
Issue #12 auto-closed
    ↓
... more PRs merged ...
    ↓
Maintainer creates GitHub Release v0.1.0
    ↓
Release workflow: test → build → publish to npm
    ↓
Users can now `npx trail@0.1.0 init`
```

---

## 10. Branch workflow (user repos)

### Key facts

- GitHub Issues are global (not branch-specific)
- Local `.trail/tasks/` files travel with git branches
- Sync always talks to the same GitHub Issues regardless of branch

### Scenarios

**On a feature branch behind main:** `trail sync` pulls fresh from GitHub, updating local files on the current branch. Merge to main handles file merging — file-per-task means conflicts are rare.

**Creating a draft on a branch:** Draft lives only on that branch. Others don't see it until it's promoted to a GitHub Issue (which is global).

**Two branches creating tasks independently:** No collision — drafts use random hashes, synced tasks use GitHub issue numbers.

---

## 11. UI design

### Installation

Separate npm package, opt-in. Not bundled with CLI.

### Technology

React + Vite + TypeScript. Reads `.trail/snapshot.json`.

### Views

| View | Description |
|---|---|
| Kanban board | Tasks grouped by status columns |
| List view | Filterable table (by label, assignee, priority, milestone) |
| Timeline / roadmap | Tasks on horizontal axis by start_date → due_date, grouped by milestone |
| Epic tree | Parent-child hierarchy, expandable |
| Dependency graph | Visual DAG from depends_on/blocks |
| Task detail panel | Full task information |

### Refresh behavior

| Browser state | Poll interval |
|---|---|
| Tab focused | 30 seconds |
| Tab background 5+ min | 2 minutes |
| Tab background 30+ min | 10 minutes |
| Tab closed / `trail ui` stopped | No polling |

Uses browser `visibilitychange` API for backoff. No background daemon.

### Isolation

- `@trail/ui` is a devDependency — never in production bundles
- `trail ui` runs a standalone Vite dev server — separate from the user's app
- `trail export` produces static HTML — openable locally or via GitHub Pages

---

## 12. Security and privacy

### Hard rules

1. Trail **never stores tokens** — reads from environment or `gh` on demand
2. Trail **never sends data** anywhere except `api.github.com`
3. **No telemetry**, no analytics, no phoning home
4. `.trail/config.json` **never contains secrets**
5. All GitHub API calls use **HTTPS**
6. All task JSON validated against **Zod schemas** on read and write
7. **No `eval()`**, no dynamic code execution, no template injection

### Dependencies (minimal)

| Dependency | Purpose | Dev-only? |
|---|---|---|
| `zod` | Schema validation | No |
| `commander` | CLI argument parsing | No |
| `tsup` | Build/bundle | Yes |
| `vitest` | Testing | Yes |

Four total. Two ship to users.

---

## 13. Contributor experience

### Key files

| File | Audience | Purpose |
|---|---|---|
| `AGENTS.md` | All AI agents | How to work in this repo |
| `CLAUDE.md` | Claude Code | Points to AGENTS.md + Claude-specific flags |
| `CONTRIBUTING.md` | Humans | Fork, branch, PR process |
| `README.md` | Everyone | What Trail is, commands, quick-start |
| `.cursor/rules/` | Cursor | 5 focused rule files (no plugin dependencies) |
| `.claude/` | Claude Code | Settings + custom commands |
| `docs/adr/` | Everyone | Architectural decisions |

### Cursor rules (5 files, standalone)

| File | Purpose |
|---|---|
| `00-project.mdc` | What Trail is, architecture overview, key decisions |
| `01-contributing.mdc` | Branch naming, commits, PR process |
| `02-code-standards.mdc` | TypeScript strict, Zod, error handling, no `any` |
| `03-testing.mdc` | Vitest, co-located tests, coverage expectations |
| `04-architecture.mdc` | Package boundaries, where things live |

### Foundational ADRs (before any code)

| ADR | Decision |
|---|---|
| `001-typescript-node.md` | Runtime: Node.js, Language: TypeScript strict, Build: tsup |
| `002-json-task-format.md` | Task files are JSON, validated with Zod |
| `003-github-issues-source-of-truth.md` | GitHub Issues is remote source of truth, no Projects |
| `004-two-package-monorepo.md` | CLI+core in one package, UI separate, npm workspaces |
| `005-sync-ownership-model.md` | Field ownership and conflict resolution |
| `006-testing-strategy.md` | Vitest, co-located, unit + integration |

---

## 14. MVP milestones

### MVP A — The sync loop

- `trail init`, `trail sync`, `trail list`, `trail show`, `trail status`, `trail next`, `trail update`, `trail done`, `trail validate`
- Task JSON schema (Zod-validated)
- Sync engine with ownership model and conflict detection
- Snapshot compiler
- `--json` flag on all read commands
- Auth via `GITHUB_TOKEN` + `gh` fallback

**Done when:** Full sync loop works end-to-end with real GitHub Issues across two contributors.

### MVP B — Rich task management

- `trail create`, `trail promote`, `trail dep add/remove`, `trail graph`, `trail context`
- Epic/parent support
- Collaborative mode auto-sync
- MCP server
- `AGENTS.md` template for user repos

**Done when:** An AI agent can autonomously pick, execute, and complete tasks via CLI or MCP.

### MVP C — Local UI

- `trail ui`, `trail ui install`, `trail export`
- Kanban, list, timeline, epic tree, dependency graph views
- Task detail panel
- Smart polling with tab-visibility backoff

**Done when:** Full project visualization in browser with real-time sync.

### Future

- AI task breakdowns (PRD → tasks)
- Next-task suggestions with reasoning
- Merge conflict risk insights
- GitHub Actions automation
- Cross-repo aggregation
- VS Code / Cursor extension
- `trail init` generating Cursor/Claude rules for user repos

---

## 15. Config schema

`.trail/config.json`:

```json
{
  "github": {
    "owner": "joeydekruis",
    "repo": "my-project"
  },
  "sync": {
    "preset": "collaborative",
    "auto_sync_on_command": true,
    "ui_poll_interval_seconds": 30,
    "ui_idle_backoff": true
  }
}
```

| Field | Description |
|---|---|
| `github.owner` | GitHub repository owner |
| `github.repo` | GitHub repository name |
| `sync.preset` | `collaborative`, `solo`, or `offline` |
| `sync.auto_sync_on_command` | Auto-sync on every CLI command (collaborative = true, solo = false, offline = false) |
| `sync.ui_poll_interval_seconds` | Base polling interval for UI (default 30) |
| `sync.ui_idle_backoff` | Enable smart backoff on tab blur (default true) |
