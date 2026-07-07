/** Default AGENTS.md pointer at the repository root for consumer repos using Trail. */
export const ROOT_AGENTS_MD = `# AI agents

This repository uses [Trail](https://github.com/joeydekruis/trail) for GitHub-native task tracking.

**Task workflow:** see [.trail/AGENTS.md](.trail/AGENTS.md) for how to sync, pick tasks, load context, update status, and mark work done.
`;

/** @deprecated Use {@link ROOT_AGENTS_MD}. Kept for tests and callers expecting the old export name. */
export const USER_AGENTS_MD = ROOT_AGENTS_MD;
