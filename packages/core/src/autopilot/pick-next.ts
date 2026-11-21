import type { IssueCacheRecord } from "../issues/types.js";
import { compareByPriority } from "../issues/priority.js";
import type { WorktreeRecord } from "../worktree/types.js";

const ACTIVE_WORKTREE_STATUSES = new Set([
  "queued",
  "running",
  "waiting",
  "review",
]);

export function issueHasPickupLabel(
  issue: IssueCacheRecord,
  pickupLabels: readonly string[],
): boolean {
  const wanted = new Set(pickupLabels.map((label) => label.trim().toLowerCase()));
  return issue.labels.some((label) => wanted.has(label.trim().toLowerCase()));
}

/** Autopilot must not dequeue new Todo issues while a run waits on a decision. */
export function autopilotQueueBlockedByDecisions(
  worktrees: readonly WorktreeRecord[],
): boolean {
  return worktrees.some((wt) => wt.status === "waiting");
}

export function occupiedIssueNumbers(
  worktrees: readonly WorktreeRecord[],
): Set<number> {
  const set = new Set<number>();
  for (const wt of worktrees) {
    if (ACTIVE_WORKTREE_STATUSES.has(wt.status)) {
      set.add(wt.issueNumber);
    }
  }
  return set;
}

/** Next Todo issue autopilot should pick (priority, then issue number). */
export function pickAutopilotIssue(
  issues: readonly IssueCacheRecord[],
  worktrees: readonly WorktreeRecord[],
  pickupLabels: readonly string[],
): IssueCacheRecord | null {
  const blocked = occupiedIssueNumbers(worktrees);
  const candidates = issues.filter(
    (issue) =>
      issue.state === "open" &&
      issue.boardColumn === "todo" &&
      !blocked.has(issue.number) &&
      issueHasPickupLabel(issue, pickupLabels),
  );
  if (candidates.length === 0) {
    return null;
  }
  candidates.sort(
    (a, b) =>
      compareByPriority(a.priority, b.priority) ||
      a.number - b.number,
  );
  return candidates[0] ?? null;
}