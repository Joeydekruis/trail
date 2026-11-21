import type { DecisionConflictStore } from "./conflict-store.js";
import type { DecisionStore } from "./store.js";

export type DecisionContentConflictResolution =
  | "keep_a_supersede_b"
  | "keep_b_supersede_a"
  | "keep_both";

export type ResolveDecisionContentConflictInput = {
  workspaceId: string;
  adrIdA: string;
  adrIdB: string;
  resolution: DecisionContentConflictResolution;
  scopeNote?: string;
};

const DEFAULT_SCOPE_NOTE =
  "Both ADRs stay accepted; this note records where each applies after resolving the content conflict.";

export function resolveDecisionContentConflict(
  decisions: DecisionStore,
  conflicts: DecisionConflictStore,
  input: ResolveDecisionContentConflictInput,
): { ok: true } | { ok: false; message: string } {
  const open = conflicts.listByWorkspace(input.workspaceId).find(
    (row) => row.adrIdA === input.adrIdA && row.adrIdB === input.adrIdB,
  );
  if (!open) {
    return { ok: false, message: "Decision conflict not found" };
  }

  const note = input.scopeNote?.trim() || DEFAULT_SCOPE_NOTE;

  if (input.resolution === "keep_a_supersede_b") {
    const superseded = decisions.markSuperseded(input.workspaceId, input.adrIdB, note);
    if (!superseded) {
      return { ok: false, message: "Could not supersede the losing decision" };
    }
  } else if (input.resolution === "keep_b_supersede_a") {
    const superseded = decisions.markSuperseded(input.workspaceId, input.adrIdA, note);
    if (!superseded) {
      return { ok: false, message: "Could not supersede the losing decision" };
    }
  } else {
    const a = decisions.appendConsequences(input.workspaceId, input.adrIdA, note);
    const b = decisions.appendConsequences(input.workspaceId, input.adrIdB, note);
    if (!a || !b) {
      return { ok: false, message: "Could not update both decisions" };
    }
  }

  conflicts.deletePair(input.workspaceId, input.adrIdA, input.adrIdB);
  return { ok: true };
}