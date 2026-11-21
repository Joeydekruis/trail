import { describe, expect, it } from "vitest";
import { MemorySqlite, openIssueCacheStore, openWorktreeStore, openWorkspaceStore } from "@trail/core";
import { finalizeAgentRun } from "./agent-draft-pr.js";

describe("finalizeAgentRun", () => {
  it("marks worktree review in E2E mode on success", async () => {
    const prev = process.env.TRAIL_E2E;
    process.env.TRAIL_E2E = "1";
    try {
      const db = new MemorySqlite();
      const workspaces = openWorkspaceStore(db);
      const issues = openIssueCacheStore(db);
      const worktrees = openWorktreeStore(db);
      const ws = workspaces.getActive();
      issues.replaceWorkspaceIssues(ws.id, [
        {
          workspaceId: ws.id,
          number: 42,
          title: "Board drag",
          state: "open",
          boardColumn: "in-progress",
          priority: "medium",
          labels: [],
          updatedAt: new Date().toISOString(),
          htmlUrl: "https://github.com/o/r/issues/42",
          assigneeLogin: null,
          body: null,
        },
      ]);
      worktrees.upsert({
        id: `${ws.id}:42`,
        workspaceId: ws.id,
        issueNumber: 42,
        title: "Board drag",
        branch: "agent/42-board-drag",
        path: "/tmp/wt-42",
        status: "running",
        isRemote: false,
        createdAt: new Date().toISOString(),
        pullRequestUrl: null,
      });

      await finalizeAgentRun(
        ws.id,
        42,
        0,
        { workspaces, issues, worktrees },
        { triggerAutopilot: false },
      );
      const row = worktrees.get(ws.id, 42);
      expect(row?.status).toBe("review");
      expect(row?.isRemote).toBe(true);
      expect(issues.get(ws.id, 42)?.boardColumn).toBe("in-review");
    } finally {
      if (prev === undefined) {
        delete process.env.TRAIL_E2E;
      } else {
        process.env.TRAIL_E2E = prev;
      }
    }
  });
});