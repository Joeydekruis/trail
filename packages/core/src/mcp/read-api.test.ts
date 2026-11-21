import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openIssueCacheStore } from "../issues/store.js";
import { openDecisionStore } from "../decisions/store.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { knowledgeDocId } from "../knowledge/slug.js";
import { openPreviewPinStore } from "../preview/pin-store.js";
import { openWorktreeStore } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { mcpGetDecision, mcpListDecisions, mcpListTasks, mcpSearchDocs } from "./read-api.js";

describe("mcp read-api", () => {
  it("lists tasks from issue cache", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const issues = openIssueCacheStore(db);
    const knowledge = openKnowledgeDocStore(db);
    const decisions = openDecisionStore(db);
    const worktrees = openWorktreeStore(db);
    const pins = openPreviewPinStore(db);
    const ws = workspaces.getActive();
    issues.replaceWorkspaceIssues(ws.id, [
      {
        workspaceId: ws.id,
        number: 42,
        title: "Board drag",
        state: "open",
        boardColumn: "todo",
        priority: "medium",
        labels: [],
        updatedAt: new Date().toISOString(),
        htmlUrl: "https://github.com/o/r/issues/42",
        body: "Body",
      },
    ]);
    const rows = mcpListTasks({ workspaces, issues, knowledge, decisions, worktrees, pins });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("#42");
  });

  it("lists seeded decisions from SQLite", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const issues = openIssueCacheStore(db);
    const knowledge = openKnowledgeDocStore(db);
    const decisions = openDecisionStore(db);
    const worktrees = openWorktreeStore(db);
    const pins = openPreviewPinStore(db);
    const ws = workspaces.getActive();
    const listed = mcpListDecisions({ workspaces, issues, knowledge, decisions, worktrees, pins }, ws.id);
    const seeded = listed.find((row) => row.id === "ADR-012");
    expect(seeded?.title).toContain("worktree");
    const full = mcpGetDecision(
      { workspaces, issues, knowledge, decisions, worktrees, pins },
      { workspaceId: ws.id, id: "ADR-012" },
    );
    expect(full?.title).toContain("worktree");
  });

  it("merges legacy ADR knowledge docs with SQLite decisions", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const issues = openIssueCacheStore(db);
    const knowledge = openKnowledgeDocStore(db);
    const decisions = openDecisionStore(db);
    const worktrees = openWorktreeStore(db);
    const pins = openPreviewPinStore(db);
    const ws = workspaces.getActive();
    knowledge.upsert({
      id: knowledgeDocId(ws.id, "adr-001-preview"),
      workspaceId: ws.id,
      slug: "adr-001-preview",
      title: "ADR-001 Preview pins",
      bodyMarkdown: "# Context\nPreview pins land in SQLite.",
      updatedAt: new Date().toISOString(),
    });
    const listed = mcpListDecisions({ workspaces, issues, knowledge, decisions, worktrees, pins }, ws.id);
    expect(listed.some((row) => row.id === "ADR-001")).toBe(true);
    const full = mcpGetDecision(
      { workspaces, issues, knowledge, decisions, worktrees, pins },
      { workspaceId: ws.id, id: "ADR-001" },
    );
    expect(full?.slug).toBe("adr-001-preview");
  });

  it("search_docs scans knowledge bodies", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const issues = openIssueCacheStore(db);
    const knowledge = openKnowledgeDocStore(db);
    const decisions = openDecisionStore(db);
    const worktrees = openWorktreeStore(db);
    const pins = openPreviewPinStore(db);
    const ws = workspaces.getActive();
    knowledge.upsert({
      id: knowledgeDocId(ws.id, "onboarding"),
      workspaceId: ws.id,
      slug: "onboarding",
      title: "Onboarding",
      bodyMarkdown: "Trail stores product knowledge locally for MCP search.",
      updatedAt: new Date().toISOString(),
    });
    const hits = mcpSearchDocs(
      { workspaces, issues, knowledge, decisions, worktrees, pins },
      { workspaceId: ws.id, query: "MCP search" },
    );
    expect(hits).toHaveLength(1);
    expect(hits[0]?.slug).toBe("onboarding");
  });
});