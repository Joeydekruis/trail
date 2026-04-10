# Trail

> **T**ask & **R**epository **AI** **L**ayer  
> A GitHub-native AI project management CLI.

Trail keeps tasks in **JSON files** under `.trail/tasks/` in your repository, syncs with **GitHub Issues** as the remote source of truth, and exposes a **CLI**, **`--json`** output, and an **MCP (stdio) server** so agents and editors can drive the same workflow.

---

## What is Trail?

- **GitHub Issues are the remote source of truth** — no separate database or hosted PM backend.
- **The repo is the intelligence layer** — structured tasks, dependencies, and AI-oriented fields live next to your code and are versioned in git.
- **AI-first** — list/show/next/context output is easy to pipe into LLM workflows; MCP tools mirror the same operations without shell-only scripts.
- **Minimal** — small runtime footprint; no Dolt, no Docker requirement for the CLI.

Full product vision, schema, and architecture: **[design specification](docs/superpowers/specs/2026-04-10-trail-design.md)**.  
Documentation index (specs, ADRs, plans): **[docs/README.md](docs/README.md)**.  
**[CHANGELOG.md](CHANGELOG.md)** — version history for `@trail-pm/cli`.

---

## Status

| Milestone | Scope |
| --- | --- |
| **MVP A** | Init, sync, list/show/status/next, update/done, validate, `--json` on read commands, auth via token + `gh` fallback |
| **MVP B** | Draft tasks (`create` / `promote`), dependency editing (`dep`, `graph`), `context`, MCP stdio server, optional **`AGENTS.md`** on `init` |
| **MVP C** | Local roadmap UI (`packages/ui`) — planned |

---

## Requirements

- **Node.js** >= 18
- A **git** repository (for `trail init` and sensible repo-root detection)
- For online sync and **promote**: a **GitHub** repo you can access, and authentication (see below)

---

## Installation

**Package name:** `@trail-pm/cli`. **Binary name:** `trail`.

### Important: local `npm install` does **not** put `trail` on your PATH

If you run **`npm install @trail-pm/cli`** (or `-D`) in a project, npm adds the binary to **`node_modules/.bin/trail`**. That directory is **not** on your shell `PATH` by default, so typing **`trail`** in the terminal fails with **`command not found`**.

Use one of these:

| Situation | What to run |
| --- | --- |
| **Local install** (recommended) | **`npx trail …`** — `npx` finds `node_modules/.bin/trail` |
| **Global install** | `npm install -g @trail-pm/cli` — then **`trail …`** works as a normal command |
| **No install** | **`npx @trail-pm/cli …`** (full package name each time) |

You can also run the file directly: **`./node_modules/.bin/trail init`**.

Bare `npx @trail-pm/cli --help` works for a one-off, but it still does not add **`trail`** to your PATH for later commands.

Installing the CLI **does not create `package.json`** by itself — only **`npm install …`** in your app repo does. The **`.trail/`** folder is **not** created by installing; it appears when you run **`npx trail init`** (or `npx @trail-pm/cli init`) **inside a git repository**.

### Recommended: install in your app repo

From your project directory (creates/updates **`package.json`** and **`node_modules/.bin/trail`**):

```bash
npm install @trail-pm/cli
# or, as a dev dependency:
npm install -D @trail-pm/cli
```

Then use:

```bash
npx trail --help
npx trail init --preset solo
```

Always use **`npx trail`** after a local install (not bare **`trail`**, unless you used **`-g`**).

### Other options

| Approach | How you invoke it |
| --- | --- |
| **Global** | `npm install -g @trail-pm/cli` → then **`trail …`** on your PATH |
| **One-off, no install** | **`npx @trail-pm/cli …`** — repeat the full package name for **each** command |

**From a clone of this repository** (contributors or bleeding edge):

```bash
git clone https://github.com/joeydekruis/trail.git
cd trail
npm install
npm run build
node packages/cli/trail.js --help
```

---

## Authentication

Trail talks to **api.github.com** only. It does **not** store tokens in files.

Resolution order (see design spec):

1. **`GITHUB_TOKEN`** environment variable, if set  
2. Otherwise, **`gh auth token`** if the GitHub CLI is installed and logged in  

Create a token with at least **`repo`** (and **`read:org`** if needed for your org). Export it in your shell or CI:

```bash
export GITHUB_TOKEN=ghp_...
```

---

## Quick start

After a **local** `npm install`, use **`npx trail`** (or **`npm exec trail --`**). After **`npm install -g`**, you can use **`trail`** directly.

Initialize Trail in the **current git repository** (owner/repo are taken from `origin` when you omit `--owner` / `--repo`):

```bash
# Local install (typical):
npx trail init --preset solo

# Global install only:
# trail init --preset solo

# No install:
npx @trail-pm/cli init --preset solo
```

By default, `init` creates **`AGENTS.md`** at the repo root with a short agent workflow (only if the file does not already exist). Use **`--skip-agents-md`** to skip that.

```bash
export GITHUB_TOKEN=...
npx trail sync
npx trail list
npx trail next
```

---

## Configuration

After `init`, settings live in **`.trail/config.json`**. Important fields:

| Field | Meaning |
| --- | --- |
| `github.owner`, `github.repo` | Repository for Issues API |
| `sync.preset` | `solo` — manual sync; `collaborative` — optional auto-pull before reads; `offline` — no GitHub |

See [§15 in the design spec](docs/superpowers/specs/2026-04-10-trail-design.md#15-config-schema) for the full schema.

---

## Command reference

Subcommands below are written as **`trail …`**. With a **local** npm install, run **`npx trail …`** (or use **`trail …`** only after **`npm install -g`**).

### Project setup

| Command | Description |
| --- | --- |
| **`trail init`** | Create `.trail/config.json`, `.trail/tasks/`, `.gitignore` under `.trail/`. Resolves GitHub `owner`/`repo` from `--owner`/`--repo` or `origin`. Options: `--preset`, `--skip-agents-md`. |
| **`trail sync`** | Synchronize local task files with GitHub Issues (`--pull` / `--push` to restrict direction). |

### Read-only and reporting

| Command | Description |
| --- | --- |
| **`trail list`** | List tasks; hides `done` / `cancelled` unless `--all`. Filters: `--status`, `--label`, `--limit`. **`--json`**: slim task rows. |
| **`trail show <id>`** | Show one task. **`--json`**: full task object. |
| **`trail status`** | Counts by status and sync metadata. **`--json`**. |
| **`trail next`** | Next actionable task (priority + id ordering). **`--json`** or prints a one-line summary. |
| **`trail validate`** | Compile the task graph, print warnings; exit code **1** if a **dependency cycle** is detected. |

### Editing tasks

| Command | Description |
| --- | --- |
| **`trail update <id>`** | Update local task fields (`--status`, `--priority`, `--title`). Pushes to GitHub when the task is linked and the preset allows. |
| **`trail done <id> <message...>`** | Mark done; posts to the linked issue when applicable. |

### Draft tasks (local → GitHub)

| Command | Description |
| --- | --- |
| **`trail create`** | Create a **draft** task (`draft-…` id), not yet on GitHub. Requires **`--title`**. Options: `--description`, `--type` (`feature` \| `bug` \| `chore` \| `epic`), `--priority`. |
| **`trail promote <id>`** | Create a GitHub Issue from a **draft**, replace the file with **`<issue-number>.json`**, set `github` metadata. Requires auth and a non-**offline** preset. |

### Dependencies and graph

| Command | Description |
| --- | --- |
| **`trail dep add <taskId> <dependsOnId>`** | Add a dependency (updates `depends_on` and `blocks`). |
| **`trail dep remove <taskId> <dependsOnId>`** | Remove that edge. |
| **`trail graph`** | Print dependency edges. **`--json`**: array of `{ "from", "to" }` (from depends on to). |

### Agent-oriented output

| Command | Description |
| --- | --- |
| **`trail context <id>`** | Print a **single JSON object**: compact “work packet” (goal, deps, `ai.*` fields, refs, GitHub link). Intended for LLM sessions. |

### MCP server

| Command | Description |
| --- | --- |
| **`trail mcp`** | Start the **Model Context Protocol** server on **stdio** (for Cursor, Claude Desktop, and other MCP clients). Uses the **current working directory** as the Trail repo root—configure your client so the process **`cwd`** is your project root. |

Registered tools (names stable for automation):

| Tool | Purpose |
| --- | --- |
| **`trail_list`** | Same idea as `trail list` (optional filters). |
| **`trail_show`** | Full task JSON by id. |
| **`trail_next`** | Next task or `null`. |
| **`trail_context`** | Same payload as `trail context <id>`. |
| **`trail_graph`** | Dependency edges. |
| **`trail_validate`** | Compiler warnings and `hasDependencyCycle`. |

**Example (Cursor)** — add under MCP settings; set **`cwd`** to your repo:

```json
{
  "mcpServers": {
    "trail": {
      "command": "trail",
      "args": ["mcp"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

If `trail` is not on your `PATH`, point **`command`** at `npx` and **`args`** at `["@trail-pm/cli", "mcp"]` (no global install), or use `node` / `trail.js` from a local clone.

---

## Repository layout (your project)

After `trail init`:

```text
.trail/
├── config.json       # GitHub repo + sync preset
├── tasks/            # *.json task files (committed)
├── snapshot.json     # derived, gitignored
└── .gitignore        # snapshot, export/, etc.
```

Task file shape and field reference: [design spec §4](docs/superpowers/specs/2026-04-10-trail-design.md#4-task-schema).

---

## JSON output

These commands support **`--json`** where listed above: `list`, `show`, `status`, `next`, `graph`.  
`trail context` is **always JSON** to stdout.

---

## Development (this repository)

```bash
npm install
npm test
npm run typecheck
npm run build
```

Conventions and layout for contributors: **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[AGENTS.md](AGENTS.md)**.

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)** for branches, commits, and pull requests.

---

## License

MIT
