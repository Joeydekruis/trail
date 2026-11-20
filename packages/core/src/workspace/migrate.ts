import type { SqliteDatabase } from "../db/types.js";

/** Adds `production_branch` to workspaces (schema v4). */
export function migrateWorkspaceProductionBranch(
  db: SqliteDatabase,
  schemaVersion: number,
): number {
  if (schemaVersion >= 4) {
    return schemaVersion;
  }
  db.exec(
    "ALTER TABLE workspaces ADD COLUMN production_branch TEXT NOT NULL DEFAULT 'main'",
  );
  db.prepare("DELETE FROM schema_version").run();
  db.prepare("INSERT INTO schema_version (version) VALUES (4)").run();
  return 4;
}