import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openDecisionStore } from "../decisions/store.js";
import { openIssueCacheStore } from "../issues/store.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { openPreviewPinStore } from "../preview/pin-store.js";
import { openWorktreeStore } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { resolveMcpAddTaskComment } from "./task-comment.js";

describe("resolveMcpAddTaskComment", () => {
  it("requires body and a cached task", () => {
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
    const empty = resolveMcpAddTaskComment(stores, { workspaceId: ws.id, id: "#1", body: "  " });
    expect(empty.ok).toBe(false);
    stores.issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 1,
        title: "Task",
        state: "open",
        boardColumn: "todo",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/1",
        body: "",
        assigneeLogin: null,
      },
    ]);
    const ok = resolveMcpAddTaskComment(stores, { workspaceId: ws.id, id: "#1", body: "Ship it" });
    expect(ok.ok).toBe(true);
  });
});