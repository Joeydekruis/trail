# Trail

Trail stores structured task data in this folder and syncs with **GitHub Issues** when online.

## Layout

| File / folder | Commit to git? | Purpose |
| --- | --- | --- |
| `config.json` | Yes | Repository settings and sync preset |
| `tasks/*.json` | Yes | Source task files (one file per task) |
| `snapshot.json` | No | Compiled aggregate for fast reads (regenerated automatically) |
| `AGENTS.md` | Yes | Instructions for AI coding agents |
| `.gitignore` | Yes | Keeps derived files out of git |

## Quick start

```bash
npx trail sync              # pull from GitHub, push local changes, refresh snapshot
npx trail list              # list tasks
npx trail next              # highest-priority unblocked task
npx trail context <id>      # compact work packet for an agent session
```

Use `trail` instead of `npx trail` if the CLI is installed globally.

## Local roadmap UI

Trail has an optional browser UI (**`@trail-pm/ui`**) for kanban, list, and dependency views over this folder.

```bash
npm install -D @trail-pm/ui   # once, alongside the CLI
npx trail-ui                  # from the repository root
```

Open the URL printed in the terminal (default **http://localhost:4700**). Set `TRAIL_UI_PORT` to change the port.

The UI reads `snapshot.json`, shows last sync time, and includes a **Sync** button (GitHub pull/push when not in offline mode). Refresh interval is `sync.ui_poll_interval_seconds` in `config.json` (default 30 seconds).

## Sync presets

Configured in `config.json` under `sync.preset`:

| Preset | Behavior |
| --- | --- |
| **collaborative** | Auto-sync on every command; best for teams |
| **solo** | Sync only when you run `trail sync` |
| **offline** | No GitHub; local files only |

## More help

- Agent workflow: see [AGENTS.md](./AGENTS.md)
- Full CLI reference: [Trail README](https://github.com/joeydekruis/trail/blob/main/README.md)
