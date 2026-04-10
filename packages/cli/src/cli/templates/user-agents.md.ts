/** Default AGENTS.md for consumer repos using Trail (embedded in CLI). */
export const USER_AGENTS_MD = `# Trail — Agent workflow

This repository uses [Trail](https://github.com/joeydekruis/trail) for GitHub-native task tracking. Task JSON lives in \`.trail/tasks/\`; GitHub Issues are the remote source of truth when online.

## Before coding

1. Run \`trail sync\` (or rely on collaborative mode) so local tasks match GitHub.
2. Run \`trail next\` (or \`trail next --json\`) to pick the highest-priority unblocked task.
3. Run \`trail context <id>\` to load a compact JSON work packet for your session.

## While working

- Update status: \`trail update <id> --status in_progress\`
- Use \`trail list\`, \`trail show <id>\`, and \`trail validate\` as needed.

## When finished

1. \`trail done <id> "what you did"\` — closes the linked GitHub issue when configured.
2. Commit using the suggested message (includes \`closes #N\` when linked).

## Docs

- Trail design (upstream): see your fork or \`trail\` repo \`docs/superpowers/specs/\`
`;
