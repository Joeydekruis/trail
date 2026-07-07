/** Default AGENTS.md written under \`.trail/\` in consumer repos. */
export const TRAIL_AGENTS_MD = `# Trail — Agent workflow

This repository uses [Trail](https://github.com/joeydekruis/trail) for GitHub-native task tracking. Task JSON lives in \`.trail/tasks/\`; GitHub Issues are the remote source of truth when online.

See also: [README.md](./README.md) for folder layout and sync presets.

If Trail is installed **locally** (\`npm install @trail-pm/cli\`), prefix commands with \`npx\` (e.g. \`npx trail sync\`). If you use a **global** install (\`npm install -g\`), run \`trail …\` directly.

## Before coding

1. Run \`npx trail sync\` or \`trail sync\` (or rely on collaborative mode) so local tasks match GitHub.
2. Run \`npx trail next\` or \`trail next\` (add \`--json\` when scripting) to pick the highest-priority unblocked task.
3. Run \`npx trail context <id>\` or \`trail context <id>\` to load a compact JSON work packet for your session.

## While working

- Update status: \`npx trail update <id> --status in_progress\` (or \`trail update …\` if global).
- Use \`npx trail list\`, \`npx trail show <id>\`, and \`npx trail validate\` as needed (drop \`npx\` if Trail is installed globally).

## When finished

1. \`npx trail done <id> "what you did"\` (or \`trail done …\`) — closes the linked GitHub issue when configured.
2. Commit task changes under \`.trail/tasks/\` and use the suggested commit message (includes \`closes #N\` when linked).

## Docs

- Trail design (upstream): see the \`trail\` repo \`docs/superpowers/specs/\`
`;
