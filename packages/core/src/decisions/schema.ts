import type { SqliteDatabase } from "../db/types.js";

const CREATE_DECISIONS = `
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  adr_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  context_markdown TEXT NOT NULL,
  decision_markdown TEXT NOT NULL,
  consequences_markdown TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'Trail',
  blocks_issue_number INTEGER,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, adr_id)
);
`;

/** Schema version 8 — Trail decisions (ADR records in SQLite). */
export function migrateDecisions(db: SqliteDatabase, schemaVersion: number): number {
  let version = schemaVersion;
  if (version < 8) {
    db.exec(CREATE_DECISIONS);
    version = 8;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}