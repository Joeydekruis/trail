import { describe, expect, it } from "vitest";
import { mergeWorkspaceIssuesFromGitHub, issueSidesDiffer } from "./sync-merge.js";
import type { IssueCacheRecord } from "./types.js";

function issue(
  number: number,
  state: string,
  boardColumn: IssueCacheRecord["boardColumn"],
  labels: string[] = [],
): IssueCacheRecord {
  return {
    workspaceId: "trail",
    number,
    title: `Issue ${number}`,
    state,
    boardColumn,
    priority: "medium",
    labels,
    updatedAt: "2026-01-01T00:00:00.000Z",
    htmlUrl: `https://github.com/o/r/issues/${number}`,
    body: null,
    assigneeLogin: null,
  };
}

describe("mergeWorkspaceIssuesFromGitHub", () => {
  it("keeps local row when github diverges and records a conflict", () => {
    const local = [issue(37, "open", "in-progress")];
    const remote = [issue(37, "closed", "done")];
    expect(issueSidesDiffer(local[0], remote[0])).toBe(true);
    const { merged, conflicts } = mergeWorkspaceIssuesFromGitHub(
      "trail",
      local,
      remote,
      "2026-01-02T00:00:00.000Z",
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].issueNumber).toBe(37);
    expect(merged).toHaveLength(1);
    expect(merged[0].boardColumn).toBe("in-progress");
    expect(merged[0].state).toBe("open");
  });

  it("replaces cache when github matches", () => {
    const local = [issue(1, "open", "todo", ["agent-ready"])];
    const remote = [issue(1, "open", "todo", ["agent-ready"])];
    const { merged, conflicts } = mergeWorkspaceIssuesFromGitHub(
      "trail",
      local,
      remote,
      "2026-01-02T00:00:00.000Z",
    );
    expect(conflicts).toHaveLength(0);
    expect(merged[0]).toEqual(remote[0]);
  });

  it("detects assignee drift", () => {
    const local = [{ ...issue(5, "open", "todo"), assigneeLogin: "dev-a" }];
    const remote = [{ ...issue(5, "open", "todo"), assigneeLogin: "dev-b" }];
    expect(issueSidesDiffer(local[0], remote[0])).toBe(true);
  });
});