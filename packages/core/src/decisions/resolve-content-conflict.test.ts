import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { openDecisionConflictStore } from "./conflict-store.js";
import { refreshDecisionContentConflicts } from "./reconcile-conflicts.js";
import { resolveDecisionContentConflict } from "./resolve-content-conflict.js";
import { openDecisionStore } from "./store.js";

describe("resolveDecisionContentConflict", () => {
  it("supersedes one ADR and clears the conflict row", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const decisions = openDecisionStore(db);
    const conflicts = openDecisionConflictStore(db);
    const ws = workspaces.getActive();
    refreshDecisionContentConflicts(ws.id, decisions, conflicts);
    const open = conflicts.listByWorkspace(ws.id);
    expect(open).toHaveLength(1);
    const row = open[0]!;

    const result = resolveDecisionContentConflict(decisions, conflicts, {
      workspaceId: ws.id,
      adrIdA: row.adrIdA,
      adrIdB: row.adrIdB,
      resolution: "keep_b_supersede_a",
    });
    expect(result.ok).toBe(true);
    expect(conflicts.listByWorkspace(ws.id)).toHaveLength(0);
    expect(decisions.get(ws.id, row.adrIdA)?.status).toBe("superseded");
    expect(decisions.get(ws.id, row.adrIdB)?.status).toBe("accepted");
  });
});