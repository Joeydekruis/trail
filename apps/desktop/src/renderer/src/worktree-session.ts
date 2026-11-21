import type { WorktreeDto } from "@trail/ipc";

export type WorktreeSessionContext = {
  issueNumber: number;
  issueRef: string;
  title: string;
  branch: string;
  path: string;
  status: WorktreeDto["status"];
  statusLabel: string;
  pullRequestUrl: string | null;
};

const STATUS_LABELS: Record<WorktreeDto["status"], string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Waiting",
  review: "Draft PR",
  merged: "Merged",
  failed: "Failed",
  stopped: "Stopped",
};

export function worktreeStatusLabel(status: WorktreeDto["status"]): string {
  return STATUS_LABELS[status];
}

export function worktreeToSession(worktree: WorktreeDto): WorktreeSessionContext {
  return {
    issueNumber: worktree.issueNumber,
    issueRef: `#${worktree.issueNumber}`,
    title: worktree.title,
    branch: worktree.branch,
    path: worktree.path,
    status: worktree.status,
    statusLabel: worktreeStatusLabel(worktree.status),
    pullRequestUrl: worktree.pullRequestUrl,
  };
}

export function issueNumberFromRef(issue: string): number | null {
  const match = /^#(\d+)$/.exec(issue.trim());
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function worktreeCtaForIssue(
  worktrees: WorktreeDto[],
  issueNumber: number,
): string {
  return worktrees.some((wt) => wt.issueNumber === issueNumber)
    ? "Open worktree"
    : "Start in worktree";
}