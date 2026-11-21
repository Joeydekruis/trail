import type { KnowledgeDocRecord } from "./types.js";
import { knowledgeDocId, slugFromTitle } from "./slug.js";

const WORKTREES_MD = `# Worktrees

## What a worktree contains

A worktree is one task made concrete: a git branch, a working copy on disk, the agent session that works in it, and the issue it belongs to.

## Lifecycle

Trail creates the worktree from development when a task is picked up. After merge, Trail archives it under Remote worktrees.
`;

/** Demo seed when a workspace has no knowledge docs yet. */
export function defaultKnowledgeSeed(workspaceId: string): KnowledgeDocRecord[] {
  const now = new Date().toISOString();
  const title = "Worktrees";
  const slug = slugFromTitle(title);
  return [
    {
      id: knowledgeDocId(workspaceId, slug),
      workspaceId,
      slug,
      title,
      bodyMarkdown: WORKTREES_MD,
      updatedAt: now,
    },
  ];
}