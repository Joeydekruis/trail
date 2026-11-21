import { describe, expect, it } from "vitest";
import { MemorySqlite, openIssueCacheStore, openWorkspaceStore } from "@trail/core";
import { moveBoardIssue } from "./board-move-issue.js";

describe("moveBoardIssue", () => {
  it("updates cache in E2E mode without GitHub", async () => {
    const prev = process.env.TRAIL_E2E;
    process.env.TRAIL_E2E = "1";
    try {
      const db = new MemorySqlite();
      const workspaces = openWorkspaceStore(db);
      const issues = openIssueCacheStore(db);
      const ws = workspaces.getActive();
      issues.replaceWorkspaceIssues(ws.id, [
        {
          workspaceId: ws.id,
          number: 7,
          title: "Autopilot pick",
          state: "open",
          boardColumn: "todo",
          priority: "medium",
          labels: ["agent-ready"],
          updatedAt: new Date().toISOString(),
          htmlUrl: "https://github.com/o/r/issues/7",
          body: null,
        },
      ]);
      const result = await moveBoardIssue({
        workspaces,
        issues,
        workspaceId: ws.id,
        issueNumber: 7,
        targetColumn: "in-progress",
      });
      expect(result.ok).toBe(true);
      expect(issues.get(ws.id, 7)?.boardColumn).toBe("in-progress");
    } finally {
      if (prev === undefined) {
        delete process.env.TRAIL_E2E;
      } else {
        process.env.TRAIL_E2E = prev;
      }
    }
  });
});