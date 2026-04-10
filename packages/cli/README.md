# `@trail-pm/cli`

**Trail** — Task & Repository AI Layer: a GitHub-native project management CLI.

## Install

**Recommended:** add it to your app repo, then invoke with **`npx trail`** (local install does **not** put `trail` on your shell `PATH`):

```bash
npm install @trail-pm/cli
# or: npm install -D @trail-pm/cli
npx trail --help
npx trail init --preset solo
```

**Global (optional):** `npm install -g @trail-pm/cli` → then **`trail`** works as a normal command.

**Without installing:** use **`npx @trail-pm/cli <command>`** each time.

Installing the package does **not** create `.trail/`; run **`npx trail init`** inside a git repo. Full guide:

**https://github.com/joeydekruis/trail#installation**

## Usage

```bash
npx trail init --preset solo
```

## License

MIT — see the [repository](https://github.com/joeydekruis/trail).
