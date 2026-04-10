# MVP A — CLI + GitHub sync implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working `trail` CLI that initializes `.trail/`, syncs GitHub Issues ↔ local JSON task files, compiles `snapshot.json`, and exposes read/write commands with `--json` on reads — proving the end-to-end loop for two contributors.

**Architecture:** Pure TypeScript in `packages/cli/src/`. **No new runtime dependencies** beyond existing `zod` and `commander`. GitHub access uses **native `fetch`** (Node 18+). Token resolution: `GITHUB_TOKEN` then `gh auth token` via `child_process.execFile`. Core modules are pure where possible; I/O and `fetch` live in dedicated modules. CLI commands parse args and call core.

**Tech Stack:** TypeScript strict, Vitest, Commander, Zod, tsup.

**Spec:** `docs/superpowers/specs/2026-04-10-trail-design.md` (sections 4–6, 7, 14, MVP A milestone)

**Out of scope for MVP A (defer to MVP B/C):** `trail create`, `trail promote`, `trail dep *`, `trail graph`, `trail context`, `trail ui`, MCP, draft IDs (`draft-*`), UI package, GitHub Projects.

---

## File map (create or replace)

| Path | Responsibility |
|---|---|
| `packages/cli/src/index.ts` | CLI entry: `parse argv`, dispatch to `runCli` |
| `packages/cli/src/cli/run-cli.ts` | Commander program, global `--json` where applicable |
| `packages/cli/src/cli/commands/*.ts` | One file per command group (`init`, `sync`, `list`, …) |
| `packages/cli/src/core/errors.ts` | Discriminated union / classes for typed CLI errors |
| `packages/cli/src/core/paths.ts` | Resolve repo root, `.trail/` paths |
| `packages/cli/src/core/auth.ts` | `resolveGitHubToken(): Result<string, AuthError>` |
| `packages/cli/src/core/github-client.ts` | `fetch` wrappers: list issues, get issue, update issue, create comment |
| `packages/cli/src/core/github-types.ts` | Narrow types for GitHub REST JSON (minimal fields) |
| `packages/cli/src/core/task-store.ts` | Read/write/list `packages/cli` → actually `.trail/tasks/*.json` on disk |
| `packages/cli/src/core/compile-snapshot.ts` | Tasks → `Snapshot` + cycle detection for `validate` / warnings |
| `packages/cli/src/core/sync.ts` | Pull, push, full sync orchestration |
| `packages/cli/src/schemas/task.ts` | Full `Task` Zod schema (replace minimal `TaskStatusSchema`-only file) |
| `packages/cli/src/schemas/config.ts` | `TrailConfig` schema |
| `packages/cli/src/schemas/snapshot.ts` | `Snapshot` schema |
| `packages/cli/vitest.config.ts` | Vitest config if needed (coverage, alias) |

---

### Task 1: Typed errors and stdout/stderr helpers

**Files:**
- Create: `packages/cli/src/core/errors.ts`
- Create: `packages/cli/src/core/errors.test.ts`

- [ ] **Step 1: Define `TrailError` discriminated union**

Use a string `code` field and `message`. Include at least: `AUTH_REQUIRED`, `AUTH_FAILED`, `NOT_A_TRAIL_REPO`, `VALIDATION_FAILED`, `GITHUB_API`, `SYNC_CONFLICT` (reserved for future; may no-op in MVP A).

- [ ] **Step 2: Export `formatTrailError(error: TrailError): string`** for human CLI output.

- [ ] **Step 3: Tests** — one test per code path for `formatTrailError`.

- [ ] **Step 4: Commit** — `feat(core): add typed TrailError and formatting`

---

### Task 2: Full Zod schemas — config, task, snapshot

**Files:**
- Create: `packages/cli/src/schemas/config.ts`
- Create: `packages/cli/src/schemas/snapshot.ts`
- Replace: `packages/cli/src/schemas/task.ts` (merge with existing `TaskStatusSchema` tests — expand)
- Create: `packages/cli/src/schemas/task.test.ts` (replace contents — keep tests for status + full task round-trip)
- Create: `packages/cli/src/schemas/config.test.ts`
- Create: `packages/cli/src/schemas/snapshot.test.ts`

- [ ] **Step 1: `TrailConfigSchema`** matching design §15 (`github.owner`, `github.repo`, `sync.preset`, `sync.auto_sync_on_command`, `sync.ui_poll_interval_seconds`, `sync.ui_idle_backoff`). Use `z.enum` for `preset`: `collaborative` | `solo` | `offline`.

- [ ] **Step 2: `TaskSchema`** matching design §4 field reference. Use `z.string().datetime({ offset: true })` for `created_at` / `updated_at`. `github` as `z.object({ issue_number, synced_at, url }).nullable()` or optional — pick one and document in code comment (nullable is clearer for JSON `null`).

- [ ] **Step 3: `refs` as `z.array(z.object({ type: z.string(), path: z.string() }))`**

- [ ] **Step 4: `SnapshotSchema`** — at minimum: `generated_at` (ISO datetime), `tasks: z.array(TaskSchema)`, `warnings: z.array(z.object({ code: z.string(), message: z.string(), taskId: z.string().optional() }))`.

- [ ] **Step 5: Tests** — valid minimal task JSON parse; invalid task rejected; config round-trip; snapshot round-trip.

- [ ] **Step 6: Commit** — `feat(schemas): add Task, TrailConfig, and Snapshot Zod schemas`

---

### Task 3: Paths and “is this a Trail repo?”

**Files:**
- Create: `packages/cli/src/core/paths.ts`
- Create: `packages/cli/src/core/paths.test.ts`

- [ ] **Step 1: `findTrailRoot(startDir: string): string | null`** — walk upward from `startDir` until a directory containing `.trail/config.json` exists (use `fs.existsSync` + `path.join`). Max depth ~20; stop at filesystem root.

- [ ] **Step 2: `trailPaths(root: string)`** returning `{ root, trailDir, tasksDir, configPath, snapshotPath, gitignorePath }`.

- [ ] **Step 3: Tests** — use `fs.mkdtempSync` + create fake `.trail/config.json`; assert `findTrailRoot` finds it from nested cwd.

- [ ] **Step 4: Commit** — `feat(core): resolve .trail directory from cwd`

---

### Task 4: Task store (read / write / list)

**Files:**
- Create: `packages/cli/src/core/task-store.ts`
- Create: `packages/cli/src/core/task-store.test.ts`

- [ ] **Step 1: `listTaskFiles(tasksDir: string): string[]`** — read directory, filter `*.json`, sort lexicographically.

- [ ] **Step 2: `readTaskFile(path: string): Task`** — `readFile` → `JSON.parse` → `TaskSchema.parse`.

- [ ] **Step 3: `writeTaskFile(path: string, task: Task): void`** — `TaskSchema.parse(task)` then `writeFile` with `JSON.stringify(task, null, 2)` + trailing newline.

- [ ] **Step 4: `loadAllTasks(tasksDir: string): Task[]`** — map list + read; collect first error.

- [ ] **Step 5: Tests** — temp dir with two task files; `loadAllTasks` returns two tasks; corrupt file throws `VALIDATION_FAILED`.

- [ ] **Step 6: Commit** — `feat(core): add task file load/save`

---

### Task 5: Compile snapshot + validation helpers

**Files:**
- Create: `packages/cli/src/core/compile-snapshot.ts`
- Create: `packages/cli/src/core/compile-snapshot.test.ts`

- [ ] **Step 1: `detectCycles(taskIds: Set<string>, deps: Map<string, string[]>): string[][]`** — DFS or Tarjan; for MVP, simple DFS stack is fine.

- [ ] **Step 2: `compileSnapshot(tasks: Task[], now?: Date): Snapshot`** — set `generated_at`, attach warnings for: unknown dependency targets (dep id not in tasks), cycles (list cycle nodes), orphaned github reference (optional in MVP: skip if not loaded).

- [ ] **Step 3: `writeSnapshot(snapshotPath: string, snapshot: Snapshot)`** — `SnapshotSchema.parse` then write JSON (pretty print).

- [ ] **Step 4: Tests** — acyclic graph no warnings; self-cycle or A→B→A produces warning; bad dep id produces warning.

- [ ] **Step 5: Commit** — `feat(core): compile snapshot and detect dependency issues`

---

### Task 6: Auth — token resolution

**Files:**
- Create: `packages/cli/src/core/auth.ts`
- Create: `packages/cli/src/core/auth.test.ts`

- [ ] **Step 1: `resolveGitHubToken(env = process.env): Result<string, TrailError>`** — if `env.GITHUB_TOKEN` non-empty, return Ok. Else try `execFileSync('gh', ['auth', 'token'], { encoding: 'utf-8' })` trim; on ENOENT or non-zero exit return `AUTH_REQUIRED` with message listing both options.

- [ ] **Step 2: Tests** — mock `GITHUB_TOKEN` in test; test missing token path with `gh` not available (use `vi.stubEnv` / restore).

- [ ] **Step 3: Commit** — `feat(core): resolve GitHub token from env or gh CLI`

---

### Task 7: GitHub REST client (fetch)

**Files:**
- Create: `packages/cli/src/core/github-types.ts`
- Create: `packages/cli/src/core/github-client.ts`
- Create: `packages/cli/src/core/github-client.test.ts`

- [ ] **Step 1: Minimal types** for issue JSON: `number`, `title`, `body`, `state`, `labels: { name: string }[]`, `assignee: { login: string } | null`, `milestone: { title: string } | null`, `html_url`, `updated_at`.

- [ ] **Step 2: `class GitHubClient`** with constructor `(token: string, baseUrl = 'https://api.github.com')` and private `request(method, path, body?)` setting `Authorization: Bearer`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`.

- [ ] **Step 3: Methods:** `listIssues(owner, repo, params: { state: 'open' | 'all', per_page: number, page: number })`, `getIssue`, `updateIssue`, `createIssueComment`.

- [ ] **Step 4: Tests** — mock `global.fetch` with Vitest; assert URLs and headers for one `listIssues` call.

- [ ] **Step 5: Commit** — `feat(core): add GitHub REST client with tests`

---

### Task 8: Mapping GitHub Issue ↔ Task

**Files:**
- Create: `packages/cli/src/core/github-mapper.ts`
- Create: `packages/cli/src/core/github-mapper.test.ts`

- [ ] **Step 1: `issueToTask(issue: GitHubIssue, existing: Task | null, now: Date): Task`** — GitHub wins for: `title`, `description` (body), `labels`, `assignee` (login), `milestone` (title). Map `state === 'closed'` → local `status` `done` or `cancelled` — **MVP rule:** closed → `done`. Open → preserve local `status` if already `in_progress` / `in_review` else default `todo`. Set `github.issue_number`, `github.url`, `github.synced_at`. Preserve local-only fields from `existing`: `depends_on`, `blocks`, `refs`, `ai`, `branch`, `estimate`, `priority`, `type` if not representable on GitHub — **priority** stays local always.

- [ ] **Step 2: `taskToIssueUpdate(task: Task): { title?, body?, state?, labels? }`** — include labels merge: existing GitHub label names + `priority:p*` from task.priority if set.

- [ ] **Step 3: Tests** — fixture issue JSON → task; closed issue forces done; priority adds label.

- [ ] **Step 4: Commit** — `feat(core): map GitHub issues to Trail tasks`

---

### Task 9: Sync engine (pull / push / full)

**Files:**
- Create: `packages/cli/src/core/sync.ts`
- Create: `packages/cli/src/core/sync.test.ts`

- [ ] **Step 1: `pullSync({ client, owner, repo, tasksDir, now })`** — paginate `listIssues` until empty; for each issue, load existing `${id}.json` if exists; merge with `issueToTask`; write file named `${issue.number}.json` with `id: String(issue.number)` (pad optional — be consistent with TaskSchema id as string).

- [ ] **Step 2: `pushSync({ client, owner, repo, tasksDir, tasks })`** — for each task with `github.issue_number` and `status !== 'draft'`, `updateIssue` from mapper; if local `status` is `done` or `cancelled`, ensure issue `state: closed`; if `done`, optionally post comment (defer to `done` command).

- [ ] **Step 3: `syncFull`** — `pullSync` then `pushSync` then `loadAllTasks` then `writeSnapshot`.

- [ ] **Step 4: Tests** — use mocked `GitHubClient` methods; verify write count.

- [ ] **Step 5: Commit** — `feat(core): implement pull/push sync`

---

### Task 10: CLI — `init`, `sync`, shared `--json`

**Files:**
- Create: `packages/cli/src/cli/run-cli.ts`
- Create: `packages/cli/src/cli/commands/init.ts`
- Create: `packages/cli/src/cli/commands/sync.ts`
- Modify: `packages/cli/src/index.ts`

- [ ] **Step 1: `runCli(argv)`** using Commander: program `trail`, version from `package.json` (import `readFileSync` of `../../package.json` or embed `0.0.1` until build step injects — prefer reading package.json from `packages/cli/package.json` at runtime via `createRequire` or fs relative to `import.meta.url`).

- [ ] **Step 2: `init` command** — flags: `--preset <solo|collaborative|offline>`, `--owner`, `--repo` (optional overrides). Detect `git remote get-url origin` via `execFile('git', ['remote','get-url','origin'])` in repo root (walk up until `.git`); parse `owner/repo` from `github.com:owner/repo.git` or `https://github.com/owner/repo.git`. Write `.trail/config.json`, `.trail/tasks/.gitkeep` or empty dir, `.trail/.gitignore` with `snapshot.json`, `export/`, `*.tmp`.

- [ ] **Step 3: `sync` command** — options `--pull`, `--push`; default full sync unless only one flag. Load config; if offline preset, error unless `--pull` skipped? **Rule:** offline → no network, exit with error if sync requested.

- [ ] **Step 4: Wire `resolveGitHubToken`** for non-offline.

- [ ] **Step 5: After every mutating command,** call `compileSnapshot` + `writeSnapshot`.

- [ ] **Step 6: Tests** — integration test: `init` in temp dir creates files (spawn CLI via `node dist/index.js` or call `runCli` programmatically).

- [ ] **Step 7: Commit** — `feat(cli): add init and sync commands`

---

### Task 11: CLI — read commands (`list`, `show`, `status`, `next`)

**Files:**
- Create: `packages/cli/src/cli/commands/list.ts`
- Create: `packages/cli/src/cli/commands/show.ts`
- Create: `packages/cli/src/cli/commands/status.ts`
- Create: `packages/cli/src/cli/commands/next.ts`
- Create: `packages/cli/src/cli/json.ts` — `printJson(data: unknown)`

- [ ] **Step 1: `list`** — default: exclude `status in ('done','cancelled')` unless `--all`; `--limit` default 25; `--status`, `--label` filters; `--json` prints array of slim task objects `{ id, title, status, priority, labels }`.

- [ ] **Step 2: `show <id>`** — full task JSON in `--json` mode.

- [ ] **Step 3: `status`** — counts by status, last sync time from config optional field `last_full_sync_at` (add to config schema in Task 2 if needed) — if not implemented, omit and show “unknown”.

- [ ] **Step 4: `next`** — pick highest priority: order `p0` < `p1` < `p2` < `p3` < undefined; among equal, lowest numeric id; skip tasks with unfinished dependencies (deps not `done`/`cancelled`).

- [ ] **Step 5: Collaborative preset:** before read commands, if `auto_sync_on_command` and not offline, run `pullSync` (same as design).

- [ ] **Step 6: Tests** — unit tests for `next` selection logic in isolation (`selectNextTask(tasks: Task[]): Task | null` exported from small module).

- [ ] **Step 7: Commit** — `feat(cli): add list, show, status, next with json output`

---

### Task 12: CLI — `update`, `done`, `validate`

**Files:**
- Create: `packages/cli/src/cli/commands/update.ts`
- Create: `packages/cli/src/cli/commands/done.ts`
- Create: `packages/cli/src/cli/commands/validate.ts`

- [ ] **Step 1: `update <id> --status` — `--priority` — `--title` (optional)** — update local task, bump `updated_at`, run `pushSync` for that task if collaborative/solo manual? **Rule for MVP A:** `update` writes local file always; if not offline and token present, call `updateIssue` for GitHub-backed fields.

- [ ] **Step 2: `done <id> <message>`** — set status `done`, `POST` issue comment with message, close issue, `updated_at`.

- [ ] **Step 3: `validate`** — load all tasks, `compileSnapshot`, print warnings; exit code 1 if any error-level issue (cycles).

- [ ] **Step 4: Tests** — `validate` returns exit 1 on cycle injected in temp tasks dir.

- [ ] **Step 5: Commit** — `feat(cli): add update, done, and validate`

---

### Task 13: Documentation and README command table

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md` (optional — add “implemented commands” subsection)

- [ ] **Step 1: README** — add “MVP A commands” table: init, sync, list, show, status, next, update, done, validate; note `--json` on reads; link to design spec.

- [ ] **Step 2: Example session** — 8–12 lines: init → sync → list → next → done.

- [ ] **Step 3: Commit** — `docs: document MVP A CLI usage`

---

### Task 14: Final verification gate

- [ ] **Step 1:** `npm run typecheck` — pass.

- [ ] **Step 2:** `npm test` — all tests pass.

- [ ] **Step 3:** `npm run build` — dist builds.

- [ ] **Step 4:** Manual smoke (local): `node packages/cli/dist/index.js init --preset offline` in temp dir — expect config without network.

- [ ] **Step 5:** Manual smoke (optional, with token): `trail sync` in a test repo with 1 issue.

- [ ] **Step 6:** Commit any fixes.

---

## Self-review (plan author)

| Spec area | Covered by task |
|---|---|
| Task JSON schema §4 | Task 2 |
| Config §15 | Task 2 |
| Snapshot compile | Task 5 |
| Auth §7 | Task 6 |
| Sync ownership (pull/push) | Task 8–9 |
| CLI commands MVP A | Tasks 10–12 |
| `--json` on reads | Tasks 10–11 |
| `trail done` + linked commit suggestion | Task 12 |
| Collaborative pull-before-read | Task 11 |

**Gaps addressed:** `last_full_sync_at` — add optional field to `TrailConfigSchema` in Task 2 when implementing `status` command, or document “not yet tracked” in CLI output for MVP A.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-10-mvp-a-cli-sync.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, two-stage review after each (spec then quality), as in `subagent-driven-development` skill.

2. **Inline execution** — Execute tasks in this session using `executing-plans` with checkpoints.

Which approach do you want for MVP A implementation?
