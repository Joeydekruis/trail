import type { SqliteDatabase } from "../db/types.js";
import { migrateAndSeed } from "./schema.js";
import type { WorkspaceRecord } from "./types.js";

const ACTIVE_KEY = "active_workspace_id";

type WorkspaceRow = {
  id: string;
  name: string;
  short_label: string;
  repository: string | null;
  integration_branch: string;
  sort_order: number;
  accent: string;
  accent_soft: string;
  accent_line: string;
  on_accent: string;
};

function mapRow(row: WorkspaceRow): WorkspaceRecord {
  return {
    id: row.id,
    name: row.name,
    shortLabel: row.short_label,
    repository: row.repository,
    integrationBranch: row.integration_branch,
    sortOrder: row.sort_order,
    accent: row.accent,
    accentSoft: row.accent_soft,
    accentLine: row.accent_line,
    onAccent: row.on_accent,
  };
}

export class WorkspaceStore {
  constructor(private readonly db: SqliteDatabase) {}

  list(): WorkspaceRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM workspaces ORDER BY sort_order ASC, name ASC",
      )
      .all() as WorkspaceRow[];
    return rows.map(mapRow);
  }

  getActiveId(): string {
    const row = this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get(ACTIVE_KEY) as { value: string } | undefined;
    if (row?.value) {
      return row.value;
    }
    const first = this.list()[0];
    if (!first) {
      throw new Error("No workspaces in cache");
    }
    this.setActiveId(first.id);
    return first.id;
  }

  setActiveId(workspaceId: string): void {
    const exists = this.db
      .prepare("SELECT 1 FROM workspaces WHERE id = ?")
      .get(workspaceId);
    if (!exists) {
      throw new Error(`Unknown workspace: ${workspaceId}`);
    }
    this.db
      .prepare(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      )
      .run(ACTIVE_KEY, workspaceId);
  }

  getActive(): WorkspaceRecord {
    const id = this.getActiveId();
    const row = this.db
      .prepare("SELECT * FROM workspaces WHERE id = ?")
      .get(id) as WorkspaceRow | undefined;
    if (!row) {
      throw new Error(`Active workspace missing: ${id}`);
    }
    return mapRow(row);
  }

  switchTo(workspaceId: string): WorkspaceRecord {
    this.setActiveId(workspaceId);
    return this.getActive();
  }
}

export function openWorkspaceStore(db: SqliteDatabase): WorkspaceStore {
  migrateAndSeed(db);
  return new WorkspaceStore(db);
}