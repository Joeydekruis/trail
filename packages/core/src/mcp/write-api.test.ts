import { describe, expect, it } from "vitest";
import { openDecisionStore } from "../decisions/store.js";
import { openIssueCacheStore } from "../issues/store.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { openPreviewPinStore } from "../preview/pin-store.js";
import { openWorktreeStore, worktreeId } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { MemorySqlite } from "../db/memory.js";
import { mcpCreateDecision } from "./write-api.js";

function openMcpWriteStores(db: MemorySqlite) {
  return {
    workspaces: openWorkspaceStore(db),
    issues: openIssueCacheStore(db),
    knowledge: openKnowledgeDocStore(db),
    decisions: openDecisionStore(db),
    worktrees: openWorktreeStore(db),
    pins: openPreviewPinStore(db),
  };
}

describe("mcpCreateDecision", () => {
  it("allocates ADR id and rejects duplicate titles", () => {
    const db = new MemorySqlite();
    const stores = openMcpWriteStores(db);
    const ws = stores.workspaces.getActive();
    const created = mcpCreateDecision(stores, {
      workspaceId: ws.id,
      title: "Use pnpm only",
      contextMarkdown: "We need one package manager.",
      decisionMarkdown: "Standardize on pnpm.",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }
    expect(created.adrId).toMatch(/^ADR-/);
    const conflict = mcpCreateDecision(stores, {
      workspaceId: ws.id,
      title: "Use pnpm only",
      contextMarkdown: "Again.",
      decisionMarkdown: "Duplicate.",
    });
    expect(conflict.ok).toBe(false);
    if (conflict.ok) {
      return;
    }
    expect(conflict.code).toBe("conflict");
  });

  it("blocks an issue when proposed with blocksIssueNumber", () => {
    const db = new MemorySqlite();
    const stores = openMcpWriteStores(db);
    const ws = stores.workspaces.getActive();
    stores.issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 99,
        title: "Blocked task",
        state: "open",
        boardColumn: "todo",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/99",
        body: "",
        assigneeLogin: null,
      },
    ]);
    stores.worktrees.upsert({
      id: worktreeId(ws.id, 99),
      workspaceId: ws.id,
      issueNumber: 99,
      title: "Blocked task",
      branch: "agent/99-blocked",
      path: "/tmp/wt-99",
      status: "queued",
      isRemote: false,
      createdAt: new Date().toISOString(),
      pullRequestUrl: null,
    });
    const created = mcpCreateDecision(stores, {
      workspaceId: ws.id,
      title: "Store X in SQLite",
      contextMarkdown: "Need a call.",
      decisionMarkdown: "Use SQLite.",
      blocksIssueNumber: 99,
    });
    expect(created.ok).toBe(true);
    const wt = stores.worktrees.get(ws.id, 99);
    expect(wt?.status).toBe("waiting");
  });
});