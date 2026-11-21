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
  if (version < 9) {
    db.exec(`
CREATE TABLE IF NOT EXISTS issue_sync_conflicts (
  workspace_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  github_state TEXT NOT NULL,
  trail_state TEXT NOT NULL,
  github_board_column TEXT NOT NULL,
  trail_board_column TEXT NOT NULL,
  github_labels_json TEXT NOT NULL,
  trail_labels_json TEXT NOT NULL,
  github_updated_at TEXT NOT NULL,
  trail_updated_at TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, issue_number)
);
`);
    version = 9;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}