import type { SqliteDatabase } from "../db/types.js";

const ISSUE_CACHE_SQL = `
CREATE TABLE IF NOT EXISTS issue_cache (
  workspace_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  state TEXT NOT NULL,
  board_column TEXT NOT NULL,
  priority TEXT NOT NULL,
  labels_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  html_url TEXT NOT NULL,
  PRIMARY KEY (workspace_id, number)
);
`;

export function migrateIssueCache(db: SqliteDatabase, schemaVersion: number): number {
  let version = schemaVersion;
  if (version < 2) {
    db.exec(ISSUE_CACHE_SQL);
    version = 2;
  }
  if (version < 3) {
    db.exec("ALTER TABLE issue_cache ADD COLUMN body TEXT");
    version = 3;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}