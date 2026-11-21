import type { DecisionStore } from "./store.js";

function decisionId(workspaceId: string, adrId: string): string {
  return `${workspaceId}:${adrId}`;
}

/** Ensures the demo ADR-007 exists when ADR-011 is already seeded (pre–conflict-UI workspaces). */
export function backfillAdr007ForTaskStoreConflict(
  workspaceId: string,
  store: DecisionStore,
): void {
  if (store.get(workspaceId, "ADR-007")) {
    return;
  }
  if (!store.get(workspaceId, "ADR-011")) {
    return;
  }
  const now = new Date().toISOString();
  store.upsert({
    id: decisionId(workspaceId, "ADR-007"),
    workspaceId,
    adrId: "ADR-007",
    title: "Keep tasks in Trail's own database",
    status: "accepted",
    author: "You",
    blocksIssueNumber: null,
    updatedAt: now,
    contextMarkdown:
      "Early Trail prototypes stored tasks locally before GitHub sync was reliable.",
    decisionMarkdown:
      "Trail keeps tasks in its own SQLite database as the task store; GitHub is a mirror.",
    consequencesMarkdown:
      "Agents and the board read from local SQLite first. Conflicts with GitHub-as-source ADRs (ADR-011).",
  });
}