import type { SqliteDatabase } from "../db/types.js";
import type { DecisionContentConflict } from "./conflict-detect.js";

export type DecisionConflictRecord = DecisionContentConflict & {
  workspaceId: string;
  detectedAt: string;
};

type ConflictRow = {
  workspace_id: string;
  adr_id_a: string;
  adr_id_b: string;
  topic: string;
  summary: string;
  detected_at: string;
};

function mapRow(row: ConflictRow): DecisionConflictRecord {
  return {
    workspaceId: row.workspace_id,
    adrIdA: row.adr_id_a,
    adrIdB: row.adr_id_b,
    topic: row.topic,
    summary: row.summary,
    detectedAt: row.detected_at,
  };
}

export class DecisionConflictStore {
  constructor(private readonly db: SqliteDatabase) {}

  listByWorkspace(workspaceId: string): DecisionConflictRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM decision_conflicts WHERE workspace_id = ? ORDER BY adr_id_a ASC, adr_id_b ASC",
      )
      .all(workspaceId) as ConflictRow[];
    return rows.map(mapRow);
  }

  upsert(workspaceId: string, conflict: DecisionContentConflict): void {
    const detectedAt = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO decision_conflicts (
          workspace_id, adr_id_a, adr_id_b, topic, summary, detected_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(workspace_id, adr_id_a, adr_id_b) DO UPDATE SET
          topic = excluded.topic,
          summary = excluded.summary`,
      )
      .run(
        workspaceId,
        conflict.adrIdA,
        conflict.adrIdB,
        conflict.topic,
        conflict.summary,
        detectedAt,
      );
  }

  deletePair(workspaceId: string, adrIdA: string, adrIdB: string): void {
    this.db
      .prepare(
        "DELETE FROM decision_conflicts WHERE workspace_id = ? AND adr_id_a = ? AND adr_id_b = ?",
      )
      .run(workspaceId, adrIdA, adrIdB);
  }

  reconcileWorkspace(workspaceId: string, detected: DecisionContentConflict[]): void {
    const open = this.listByWorkspace(workspaceId);
    const key = (a: string, b: string) => `${a}:${b}`;
    const detectedKeys = new Set(detected.map((row) => key(row.adrIdA, row.adrIdB)));
    for (const row of detected) {
      this.upsert(workspaceId, row);
    }
    for (const row of open) {
      if (!detectedKeys.has(key(row.adrIdA, row.adrIdB))) {
        this.deletePair(workspaceId, row.adrIdA, row.adrIdB);
      }
    }
  }
}

export function openDecisionConflictStore(db: SqliteDatabase): DecisionConflictStore {
  return new DecisionConflictStore(db);
}