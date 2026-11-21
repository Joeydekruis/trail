export const WORKTREE_STATUSES = [
  "queued",
  "running",
  "waiting",
  "review",
  "merged",
  "failed",
  "stopped",
] as const;

export type WorktreeStatus = (typeof WORKTREE_STATUSES)[number];

export type WorktreeRecord = {
  id: string;
  workspaceId: string;
  issueNumber: number;
  title: string;
  branch: string;
  path: string;
  status: WorktreeStatus;
  isRemote: boolean;
  createdAt: string;
  pullRequestUrl: string | null;
  agentSessionId: string | null;
};