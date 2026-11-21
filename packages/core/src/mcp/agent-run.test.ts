import { describe, expect, it } from "vitest";
import { openIssueCacheStore } from "../issues/store.js";
import { openWorktreeStore, worktreeId } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { MemorySqlite } from "../db/memory.js";
import { resolveMcpStartAgentRun, resolveMcpStopAgentRun } from "./agent-run.js";
import type { TrailMcpStores } from "./read-api.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { openDecisionStore } from "../decisions/store.js";
import { openPreviewPinStore } from "../preview/pin-store.js";

function openStores(db: MemorySqlite): TrailMcpStores {
  return {
    workspaces: openWorkspaceStore(db),
    issues: openIssueCacheStore(db),
    knowledge: openKnowledgeDocStore(db),
    decisions: openDecisionStore(db),
    worktrees: openWorktreeStore(db),
    pins: openPreviewPinStore(db),
  };
}

describe("resolveMcpStartAgentRun", () => {
  it("requires a worktree for the cached task", () => {
    const db = new MemorySqlite();
    const stores = openStores(db);
    const ws = stores.workspaces.getActive();
    stores.issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 7,
        title: "Agent task",
        state: "open",
        boardColumn: "in-progress",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/7",
        body: "",
        assigneeLogin: null,
      },
    ]);
    const missing = resolveMcpStartAgentRun(stores, { number: 7 });
    expect(missing.ok).toBe(false);
    if (missing.ok) {
      return;
    }
    expect(missing.code).toBe("not_found");

    stores.worktrees.upsert({
      id: worktreeId(ws.id, 7),
      workspaceId: ws.id,
      issueNumber: 7,
      title: "Agent task",
      branch: "agent/7-agent-task",
      path: "/tmp/agent-7",
      status: "queued",
      isRemote: false,
      createdAt: new Date().toISOString(),
    });
    const ready = resolveMcpStartAgentRun(stores, { number: 7 });
    expect(ready.ok).toBe(true);
    if (!ready.ok) {
      return;
    }
    expect(ready.prompt).toContain("#7");
    expect(ready.cwd).toBe("/tmp/agent-7");
  });

  it("stop requires a running worktree", () => {
    const db = new MemorySqlite();
    const stores = openStores(db);
    const ws = stores.workspaces.getActive();
    stores.issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 8,
        title: "Stop task",
        state: "open",
        boardColumn: "in-progress",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/8",
        body: "",
        assigneeLogin: null,
      },
    ]);
    stores.worktrees.upsert({
      id: worktreeId(ws.id, 8),
      workspaceId: ws.id,
      issueNumber: 8,
      title: "Stop task",
      branch: "agent/8-stop-task",
      path: "/tmp/agent-8",
      status: "queued",
      isRemote: false,
      createdAt: new Date().toISOString(),
    });
    const idle = resolveMcpStopAgentRun(stores, { number: 8 });
    expect(idle.ok).toBe(false);
    if (idle.ok) {
      return;
    }
    expect(idle.code).toBe("idle");

    stores.worktrees.updateStatus(ws.id, 8, "running");
    const active = resolveMcpStopAgentRun(stores, { number: 8 });
    expect(active.ok).toBe(true);
  });
});