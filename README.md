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

**MVP A (CLI + sync) implemented.** Full vision and roadmap: [design spec](docs/superpowers/specs/2026-04-10-trail-design.md).

## MVP A commands

| Command | Description |
| --- | --- |
| `init` | Initialize a Trail project in the current git repository |
| `sync` | Synchronize local tasks with GitHub Issues |
| `list` | List tasks (excludes done/cancelled unless `--all`) |
| `show` | Show one task by id |
| `status` | Task counts by status and last sync time |
| `next` | Pick the next actionable task by priority and id |
| `update` | Update a task (local file; pushes to GitHub when linked and online) |
| `done` | Mark a task done, optionally comment and close the GitHub issue |
| `validate` | Compile snapshot and print validation warnings (exit 1 on dependency cycles) |

Read commands `list`, `show`, `status`, and `next` support **`--json`** for machine-readable output.

## Example session

```bash
npm install
npm run build
node packages/cli/dist/index.js init --preset solo --owner MY_ORG --repo MY_REPO
export GITHUB_TOKEN=...
node packages/cli/dist/index.js sync
node packages/cli/dist/index.js list
node packages/cli/dist/index.js list --json
node packages/cli/dist/index.js next
node packages/cli/dist/index.js status
node packages/cli/dist/index.js validate
```

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
