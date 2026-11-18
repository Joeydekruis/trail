import type { WorkspaceDto } from "@trail/ipc";

export type DocTreeSection = {
  overline: string;
  entries: { name: string; active?: boolean; sync: "mint" | "amber" }[];
};

const TREE: DocTreeSection[] = [
  {
    overline: "docs/architecture",
    entries: [
      { name: "overview.md", sync: "mint" },
      { name: "worktrees.md", active: true, sync: "mint" },
      { name: "sync.md", sync: "amber" },
    ],
  },
  {
    overline: "docs/product",
    entries: [
      { name: "vision.md", sync: "mint" },
      { name: "roadmap.md", sync: "mint" },
    ],
  },
  {
    overline: "docs/decisions",
    entries: [
      { name: "ADR-012.md", sync: "amber" },
      { name: "ADR-011.md", sync: "mint" },
      { name: "ADR-010.md", sync: "mint" },
    ],
  },
];

const WORKTREES_BODY = {
  path: "docs/architecture/worktrees.md",
  title: "Worktrees",
  sections: [
    {
      heading: "What a worktree contains",
      body: "A worktree is one task made concrete: a git branch, a working copy on disk, the agent session that works in it, and the issue it belongs to. Opening the worktree opens all four.",
    },
    {
      heading: "Lifecycle",
      body: "Trail creates the worktree from development when a task is picked up. The agent works there and opens a draft pull request. After the pull request merges, Trail removes the worktree and moves it to Remote worktrees as history.",
    },
    {
      heading: "Where fixes land",
      body: "A fix found locally lands on development. A fix found on production lands on development first and is then brought to main, so both stay in step.",
    },
  ],
};

export function getDocsFixture(workspace: WorkspaceDto | undefined) {
  const repo = workspace?.id ?? "trail";
  return { repo, tree: TREE, doc: WORKTREES_BODY };
}