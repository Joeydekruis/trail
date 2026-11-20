# Trail

> **T**ask & **R**epository **AI** **L**ayer  

## Trail Desktop (current direction)

**Trail Desktop** is an Electron app for macOS and Windows: GitHub-native PM, worktrees, coding agents, in-app preview with pins, and MCP. Source of truth is **GitHub**; Trail keeps a local cache.

| Resource | Link |
| --- | --- |
| Bouwbriefing | [docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md](docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md) |
| Prestaties / buildgrootte | [docs/superpowers/specs/2026-11-18-trail-desktop-performance-briefing.md](docs/superpowers/specs/2026-11-18-trail-desktop-performance-briefing.md) |
| Fase 0 plan | [docs/superpowers/plans/2026-11-18-trail-desktop-phase-0.md](docs/superpowers/plans/2026-11-18-trail-desktop-phase-0.md) |
| Design reference | [design/desktop-dashboard/v1.html](design/desktop-dashboard/v1.html) |
| Dev | Node **22** (see `.nvmrc`), then `npm run bootstrap:desktop` and `npm run desktop:dev` |
| Verify locally | `npm test` and `npm run typecheck` before you commit (no CI workflow in this repo yet) |
| Blank window? | Renderer must use `@trail/core/client`; rebuild with `npm run build --workspace=@trail/core` then restart `npm run desktop:dev` |

**Windows:** Sluit Trail/Electron vóór `npm ci` (anders `EBUSY` op `electron/dist/*`). Gebruik **`npm run bootstrap:desktop`** i.p.v. kale `npm ci` — `better-sqlite3` faalt vaak op Node 25 zonder MSVC; `--ignore-scripts` + `desktop:postinstall` werkt wel.

**Monorepo:** `apps/desktop`, `packages/core`, `packages/ipc`, `packages/mcp`, `packages/tokens`. See [AGENTS.md](AGENTS.md).

---

## Legacy CLI + local web UI

The packages **`@trail-pm/cli`** and **`@trail-pm/ui`** remain in this repo until Desktop MVP. They use JSON tasks under `.trail/tasks/`, sync with GitHub Issues, and provide CLI, `--json`, local UI, and MCP on stdio.

Legacy spec: **[2026-04-10-trail-design.md](docs/superpowers/specs/2026-04-10-trail-design.md)** · [docs/legacy-cli-ui.md](docs/legacy-cli-ui.md) · [docs/README.md](docs/README.md) · [CHANGELOG.md](CHANGELOG.md)

---

## Requirements

- **Node.js** >= 22 for the monorepo desktop track (`.nvmrc`); legacy CLI tolerates >= 18
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
| **`trail init`** | Creates `.trail/config.json`, `.trail/tasks/`, `.trail/.gitignore`, `.trail/README.md`, `.trail/AGENTS.md`, and optional root `AGENTS.md`. Resolves GitHub `owner`/`repo` from `origin` or `--owner`/`--repo`. Use **`--update`** to refresh scaffold docs on an existing project. |
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
├── README.md         # quick reference for humans
├── AGENTS.md         # agent workflow (linked from root AGENTS.md)
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
npm run build          # legacy CLI + UI
npm run desktop:dev    # Electron shell
```

See **[CONTRIBUTING.md](CONTRIBUTING.md)** and **[AGENTS.md](AGENTS.md)**.

---

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## License

MIT
