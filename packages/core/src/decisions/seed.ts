import type { DecisionRecord } from "./types.js";

function decisionId(workspaceId: string, adrId: string): string {
  return `${workspaceId}:${adrId}`;
}

/** Demo ADRs when a workspace has no decisions yet. */
export function defaultDecisionSeed(workspaceId: string): DecisionRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: decisionId(workspaceId, "ADR-012"),
      workspaceId,
      adrId: "ADR-012",
      title: "Run agents in separate git worktrees",
      status: "proposed",
      author: "Claude",
      blocksIssueNumber: 44,
      updatedAt: now,
      contextMarkdown:
        "Agents need an isolated working copy per task without disturbing your main checkout.",
      decisionMarkdown:
        "Every task gets one git worktree: branch, directory, agent session, and linked issue together.",
      consequencesMarkdown:
        "Parallel agent runs are safe; Trail cleans up merged worktrees. Relates to GitHub-as-task-store (ADR-011).",
    },
    {
      id: decisionId(workspaceId, "ADR-011"),
      workspaceId,
      adrId: "ADR-011",
      title: "Use GitHub issues as the task store",
      status: "accepted",
      author: "You",
      blocksIssueNumber: null,
      updatedAt: now,
      contextMarkdown: "Trail orchestrates work above GitHub rather than duplicating tasks locally.",
      decisionMarkdown: "GitHub Issues + Projects v2 are source of truth; SQLite is cache only.",
      consequencesMarkdown: "Requires PAT/OAuth; offline mode uses cached board.",
    },
    {
      id: decisionId(workspaceId, "ADR-008"),
      workspaceId,
      adrId: "ADR-008",
      title: "Single source for product knowledge in Trail",
      status: "accepted",
      author: "You",
      blocksIssueNumber: null,
      updatedAt: now,
      contextMarkdown: "Repo docs folders created dual sources of truth.",
      decisionMarkdown: "Knowledge lives in Trail SQLite; agents read via MCP.",
      consequencesMarkdown: "No bidirectional docs sync in MVP.",
    },
  ];
}