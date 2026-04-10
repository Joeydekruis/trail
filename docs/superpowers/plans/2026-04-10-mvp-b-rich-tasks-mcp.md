# MVP B — Rich task management + MCP

**Goal:** Draft tasks (`create` / `promote`), dependency editing (`dep`), `graph` and `context`, optional user-repo `AGENTS.md`, and an MCP stdio server so agents can drive Trail without shell-only workflows.

**Spec:** `docs/superpowers/specs/2026-04-10-trail-design.md` (MVP B milestone)

**Out of scope:** MVP C UI, PRD breakdown, automated promote from AI.

---

## Deliverables

1. **`trail create`** — Create `draft-*` task JSON locally (`status: draft`, `github: null`).
2. **`trail promote <id>`** — `POST` GitHub issue, rename task file to `{number}.json`, set `id` + `github` metadata.
3. **`trail dep add <id> <dependsOnId>`** / **`trail dep remove <id> <dependsOnId>`** — Update `depends_on` / `blocks` consistently.
4. **`trail graph`** — Text (and `--json`) dependency overview.
5. **`trail context <id>`** — Compact JSON for prompts (deps, files from `ai`, constraints).
6. **`GitHubClient.createIssue`** — Required for promote.
7. **`trail mcp`** — Stdio MCP server exposing core Trail operations as tools.
8. **`trail init`** — Optional `--agents-md` (default: write `AGENTS.md` template at repo root when missing).

**Dependency:** `@modelcontextprotocol/sdk` (MCP tools server).
