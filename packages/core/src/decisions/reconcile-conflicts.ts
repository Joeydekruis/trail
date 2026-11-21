import { backfillAdr007ForTaskStoreConflict } from "./backfill-adr-007.js";
import { detectDecisionContentConflicts } from "./conflict-detect.js";
import type { DecisionConflictStore } from "./conflict-store.js";
import type { DecisionStore } from "./store.js";

export function refreshDecisionContentConflicts(
  workspaceId: string,
  decisions: DecisionStore,
  conflicts: DecisionConflictStore,
): void {
  backfillAdr007ForTaskStoreConflict(workspaceId, decisions);
  const records = decisions.listRecords(workspaceId);
  const detected = detectDecisionContentConflicts(records);
  conflicts.reconcileWorkspace(workspaceId, detected);
}