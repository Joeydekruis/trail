import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openDecisionStore } from "../decisions/store.js";
import { openIssueCacheStore } from "../issues/store.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { openPreviewPinStore } from "../preview/pin-store.js";
import { openWorktreeStore } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { resolveMcpUpdateTaskStatus } from "./task-status.js";

describe("resolveMcpUpdateTaskStatus", () => {
  it("resolves issue id and GitHub-style status names", () => {
    const db = new MemorySqlite();
    const stores = {
      workspaces: openWorkspaceStore(db),
      issues: openIssueCacheStore(db),
      knowledge: openKnowledgeDocStore(db),
      decisions: openDecisionStore(db),
      worktrees: openWorktreeStore(db),
      pins: openPreviewPinStore(db),
    };
    const ws = stores.workspaces.getActive();
    stores.issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 7,
        title: "Move me",
        state: "open",
        boardColumn: "todo",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/7",
        body: "",
        assigneeLogin: null,
      },
    ]);
    const resolved = resolveMcpUpdateTaskStatus(stores, {
      workspaceId: ws.id,
      id: "#7",
      status: "In progress",
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) {
      return;
    }
    expect(resolved.boardColumn).toBe("in-progress");
    expect(resolved.issueNumber).toBe(7);
  });
});