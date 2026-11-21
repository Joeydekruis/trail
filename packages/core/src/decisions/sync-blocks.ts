import type { WorktreeStore } from "../worktree/store.js";
import type { DecisionStore } from "./store.js";

/** Mark worktrees waiting while a proposed decision blocks their issue. */
export function syncProposedDecisionBlocks(
  workspaceId: string,
  decisions: DecisionStore,
  worktrees: WorktreeStore,
): void {
  for (const record of decisions.listProposedBlocking(workspaceId)) {
    const issueNumber = record.blocksIssueNumber;
    if (issueNumber == null) {
      continue;
    }
    const wt = worktrees.get(workspaceId, issueNumber);
    if (!wt) {
      continue;
    }
    if (wt.status !== "waiting") {
      worktrees.updateStatus(workspaceId, issueNumber, "waiting");
    }
  }
}

/** Resume a worktree after its blocking decision is accepted. */
export function releaseDecisionBlock(
  workspaceId: string,
  issueNumber: number,
  worktrees: WorktreeStore,
): void {
  const wt = worktrees.get(workspaceId, issueNumber);
  if (wt?.status === "waiting") {
    worktrees.updateStatus(workspaceId, issueNumber, "queued");
  }
}

/** Stop a worktree when its blocking ADR is rejected (no longer pursue this path). */
export function stopDecisionBlockedWorktree(
  workspaceId: string,
  issueNumber: number,
  worktrees: WorktreeStore,
): void {
  const wt = worktrees.get(workspaceId, issueNumber);
  if (!wt) {
    return;
  }
  if (wt.status === "waiting" || wt.status === "queued" || wt.status === "running") {
    worktrees.updateStatus(workspaceId, issueNumber, "stopped");
  }
}