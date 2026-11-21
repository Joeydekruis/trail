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
  if (version < 11) {
    db.exec(`
CREATE TABLE IF NOT EXISTS decision_conflicts (
  workspace_id TEXT NOT NULL,
  adr_id_a TEXT NOT NULL,
  adr_id_b TEXT NOT NULL,
  topic TEXT NOT NULL,
  summary TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, adr_id_a, adr_id_b)
);
`);
    version = 11;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}