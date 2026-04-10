/** Default AGENTS.md for consumer repos using Trail (embedded in CLI). */
export const USER_AGENTS_MD = `# Trail — Agent workflow

This repository uses [Trail](https://github.com/joeydekruis/trail) for GitHub-native task tracking. Task JSON lives in \`.trail/tasks/\`; GitHub Issues are the remote source of truth when online.

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
2. Commit using the suggested message (includes \`closes #N\` when linked).

## Docs

- Trail design (upstream): see your fork or \`trail\` repo \`docs/superpowers/specs/\`
`;
