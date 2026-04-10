# Changelog

All notable changes to **`@trail-pm/cli`** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-10

First public release of the Trail CLI (MVP A + MVP B).

### Added

#### MVP A — Sync loop

- **`trail init`** — Initialize `.trail/` in a git repo (`config.json`, `tasks/`, `.gitignore` under `.trail/`); resolve GitHub `owner`/`repo` from `origin` or flags.
- **`trail sync`** — Bidirectional sync with GitHub Issues (`--pull` / `--push`).
- **`trail list`**, **`trail show`**, **`trail status`**, **`trail next`** — Inspect tasks; filters and **`--json`** on read commands.
- **`trail update`**, **`trail done`** — Edit tasks locally; push to GitHub when linked and online.
- **`trail validate`** — Compile task graph; exit `1` on dependency cycles.
- **Authentication** — `GITHUB_TOKEN` or `gh auth token`.
- **Task schema** — Zod-validated JSON under `.trail/tasks/`; compiled **`snapshot.json`** (gitignored).

#### MVP B — Rich tasks, agents, MCP

- **`trail create`** — Local draft tasks (`draft-*` ids) before GitHub exists.
- **`trail promote`** — Open a GitHub Issue from a draft; rename task file to `{issue}.json`.
- **`trail dep add`**, **`trail dep remove`** — Maintain `depends_on` / `blocks`.
- **`trail graph`** — List dependency edges (text or **`--json`**).
- **`trail context`** — Compact JSON “work packet” for LLM sessions.
- **`trail mcp`** — Model Context Protocol server on stdio (`trail_list`, `trail_show`, `trail_next`, `trail_context`, `trail_graph`, `trail_validate`).
- **`trail init`** — Optional **`AGENTS.md`** template at repo root (skip with **`--skip-agents-md`**).

### Notes

- Runtime dependencies: `zod`, `commander`, `@modelcontextprotocol/sdk` (MCP bundled in the CLI build).
- Requires **Node.js ≥ 18**.
- The npm package exposes the `trail` binary via **`trail.js`** at the package root (it imports the built `dist/` bundle) so `npm publish` accepts the `bin` field reliably under npm 11+.

[0.1.0]: https://github.com/joeydekruis/trail/releases/tag/v0.1.0
