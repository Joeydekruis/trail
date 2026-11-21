import type { DecisionStore } from "./store.js";

export function decisionRecordId(workspaceId: string, adrId: string): string {
  return `${workspaceId}:${adrId}`;
}

/** Next ADR id in ADR-NNN form for a workspace. */
export function allocateNextAdrId(workspaceId: string, store: DecisionStore): string {
  const rows = store.list(workspaceId);
  let max = 0;
  for (const row of rows) {
    const match = /^ADR-(\d+)$/i.exec(row.adrId);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `ADR-${String(max + 1).padStart(3, "0")}`;
}