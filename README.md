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
