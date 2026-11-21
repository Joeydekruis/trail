import type { BoardColumnId } from "./columns.js";
import type { IssueCacheRecord } from "./types.js";

/** Overlay Projects v2 status onto cached issues without touching other fields. */
export function applyBoardColumnsToIssues(
  issues: IssueCacheRecord[],
  byIssue: ReadonlyMap<number, BoardColumnId>,
): IssueCacheRecord[] {
  if (byIssue.size === 0) {
    return issues;
  }
  return issues.map((issue) => {
    const mapped = byIssue.get(issue.number);
    if (!mapped || mapped === issue.boardColumn) {
      return issue;
    }
    return { ...issue, boardColumn: mapped };
  });
}