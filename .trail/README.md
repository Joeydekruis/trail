# Trail (this repository)

This folder was used for **legacy** `@trail-pm/cli` dogfooding (JSON tasks + GitHub sync). The **Trail Desktop** pivot (2026-11) uses briefing specs and GitHub Issues directly; see [docs/REPO-STATUS.md](../docs/REPO-STATUS.md).

## What stays here

| File / folder | In git? | Notes |
| --- | --- | --- |
| `config.json` | Yes | Legacy CLI/UI settings for optional local dev |
| `tasks/` | No JSON files tracked | See [tasks/README.md](./tasks/README.md) |
| `AGENTS.md` | Yes | Update when legacy CLI is fully retired |
| `.gitignore` | Yes | Still ignores `snapshot.json` |

## Legacy CLI (optional)

```bash
npx trail sync    # only if you still use @trail-pm/cli in this repo
```

Desktop development: `npm run desktop:dev` at repo root.