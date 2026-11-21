import { describe, expect, it } from "vitest";
import { autopilotQueueBlockedByDecisions, pickAutopilotIssue } from "./pick-next.js";
import type { IssueCacheRecord } from "../issues/types.js";
import type { WorktreeRecord } from "../worktree/types.js";

function issue(partial: Partial<IssueCacheRecord> & { number: number }): IssueCacheRecord {
  return {
    workspaceId: "trail",
    title: `Issue ${partial.number}`,
    state: "open",
    boardColumn: "todo",
    priority: "medium",
    labels: ["agent-ready"],
    updatedAt: new Date().toISOString(),
    htmlUrl: `https://github.com/o/r/issues/${partial.number}`,
    body: null,
    assigneeLogin: null,
    ...partial,
  };
}

describe("pickAutopilotIssue", () => {
  it("prefers urgent Todo with pickup label", () => {
    const issues = [
      issue({ number: 10, priority: "low" }),
      issue({ number: 11, priority: "urgent", labels: ["agent-ready"] }),
    ];
    const picked = pickAutopilotIssue(issues, [], ["agent-ready"]);
    expect(picked?.number).toBe(11);
  });

  it("skips issues that already have an active worktree", () => {
    const issues = [issue({ number: 5 }), issue({ number: 6 })];
    const worktrees: WorktreeRecord[] = [
      {
        id: "trail:5",
        workspaceId: "trail",
        issueNumber: 5,
        title: "x",
        branch: "agent/5-x",
        path: "/tmp/wt",
        status: "running",
        isRemote: false,
        createdAt: new Date().toISOString(),
      },
    ];
    const picked = pickAutopilotIssue(issues, worktrees, ["agent-ready"]);
    expect(picked?.number).toBe(6);
  });
});

describe("autopilotQueueBlockedByDecisions", () => {
  it("is true when any worktree waits on a decision", () => {
    const blocked = autopilotQueueBlockedByDecisions([
      {
        id: "trail:3",
        workspaceId: "trail",
        issueNumber: 3,
        title: "ADR",
        branch: "agent/3-adr",
        path: "/tmp",
        status: "waiting",
        isRemote: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    expect(blocked).toBe(true);
  });
});