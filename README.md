# Trail

> **T**ask & **R**epository **AI** **L**ayer  
> A GitHub-native AI project management CLI.

Trail keeps tasks in **JSON** under `.trail/tasks/`, syncs with **GitHub Issues**, and offers a **CLI**, **`--json`** output, an optional **local UI**, and an **MCP (stdio) server** for agents and editors.

Full product vision and schema: **[design specification](docs/superpowers/specs/2026-04-10-trail-design.md)** · **[docs/README.md](docs/README.md)** · **[CHANGELOG.md](CHANGELOG.md)**

---

## Requirements

- **Node.js** >= 18 (see repo root `package.json` for the version used in development)
- A **git** repository (for `trail init` and repo-root detection)
- For GitHub sync: a **GitHub** repo you can access, plus authentication (below)

---

## Installation

**Package:** `@trail-pm/cli` · **binary:** `trail`

**Recommended:** add the CLI as a **dev dependency** in your app repo (keeps dependencies out of production installs), then run commands with **`npx trail`**. A local install does **not** put `trail` on your `PATH`; **`npx`** resolves `node_modules/.bin/trail`.

```bash
npm install -D @trail-pm/cli
npx trail --help
```

**Alternative:** install globally so `trail` is on your `PATH`:

```bash
npm install -g @trail-pm/cli
trail --help
```

Installing the package does **not** create `.trail/`; that appears when you run **`trail init`** inside a git repo (with a resolvable GitHub `origin` or explicit `--owner` / `--repo`).

---

## Authentication

Trail uses **api.github.com** only and does **not** store tokens in project files.

1. **`GITHUB_TOKEN`** if set  
2. Otherwise **`gh auth token`** if the GitHub CLI is installed and logged in  

Create a token with at least **`repo`** (and **`read:org`** if needed). For CI, export `GITHUB_TOKEN` in the environment.

---

## Quick start

From your project (after `npm install -D @trail-pm/cli`):

```bash
npx trail init
```

In a normal terminal, **`init` asks which sync mode you want** (solo, collaborative, or offline). You can pass **`--preset`** instead when you need a non-interactive run (for example in scripts).

```bash
export GITHUB_TOKEN=...   # if not using gh
npx trail sync
npx trail list
npx trail next
```

---

## Local roadmap UI

The **`@trail-pm/ui`** package serves a browser UI plus API against your repo’s `.trail/` data.

**Install** (in your app repo, alongside the CLI):

```bash
npm install -D @trail-pm/ui
```

**Run** from the **repository root** (the same tree where `.trail/` lives). The server finds the Trail root automatically:

```bash
npx trail-ui
```

Open the URL printed in the terminal (default **http://localhost:4700**). Set **`TRAIL_UI_PORT`** (or **`TRAIL_API_PORT`**) to change the port.

**Development** (this monorepo): build the UI client first, then start the server, or use the package script that runs Vite + API together — see `packages/ui/package.json`.

The UI shows **last sync time**, a **Sync** button (full GitHub pull/push when not in offline mode), periodic refresh from disk (interval from **`sync.ui_poll_interval_seconds`** in `.trail/config.json`), and in **collaborative** mode it creates/updates GitHub issues when you create or edit tasks.

---

## Configuration

After `init`, settings live in **`.trail/config.json`**. Important fields include `github.owner`, `github.repo`, `sync.preset`, and optional `sync.ui_poll_interval_seconds` for the UI. See **[§15 in the design spec](docs/superpowers/specs/2026-04-10-trail-design.md#15-config-schema)**.

---

## Command reference

With a **local** install, use **`npx trail …`**. After **`npm install -g`**, use **`trail …`** directly.

| Command | Description |
| --- | --- |
| **`trail init`** | Creates `.trail/config.json`, `.trail/tasks/`, and `.trail/.gitignore`. Resolves GitHub `owner`/`repo` from `origin` or `--owner`/`--repo`. |
| **`trail sync`** | Pulls from GitHub, then pushes **relevant** linked tasks (active work and tasks referenced by dependencies), then refreshes the snapshot. Progress is printed to stderr (`push` shows **n/total**). |
| **`trail list`** / **`show`** / **`status`** / **`next`** / **`validate`** | List, inspect, counts, next task, graph validation. |
| **`trail update`** / **`done`** | Edit tasks; linked issues are updated when the preset allows. |
| **`trail create`** / **`promote`** | Draft tasks and promote to GitHub Issues. |
| **`trail mcp`** | MCP server on stdio (configure the client **`cwd`** to your project root). |

---

## Repository layout (your project)

```text
.trail/
├── config.json
├── tasks/            # *.json task files (committed)
├── snapshot.json     # derived, gitignored
└── .gitignore
```

---

## Development (this repository)

```bash
npm install
npm test
npm run typecheck
npm run build
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[AGENTS.md](AGENTS.md)**.

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## License

MIT
