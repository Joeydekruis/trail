import type { SqliteDatabase } from "../db/types.js";

const WORKTREE_SQL = `
CREATE TABLE IF NOT EXISTS worktrees (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  branch TEXT NOT NULL,
  path TEXT NOT NULL,
  status TEXT NOT NULL,
  is_remote INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (workspace_id, issue_number)
);
`;

/** Schema version 5 — local worktree registry. */
export function migrateWorktrees(db: SqliteDatabase, schemaVersion: number): number {
  let version = schemaVersion;
  if (version < 5) {
    db.exec(WORKTREE_SQL);
    version = 5;
  }
  if (version < 12) {
    db.exec("ALTER TABLE worktrees ADD COLUMN pull_request_url TEXT");
    version = 12;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}