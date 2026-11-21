import type { SqliteDatabase } from "../db/types.js";

const CREATE_KNOWLEDGE_DOCS = `
CREATE TABLE IF NOT EXISTS knowledge_docs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, slug)
);
`;

/** Schema version 7 — Trail knowledge docs (SQLite, not repo sync). */
export function migrateKnowledgeDocs(db: SqliteDatabase, schemaVersion: number): number {
  let version = schemaVersion;
  if (version < 7) {
    db.exec(CREATE_KNOWLEDGE_DOCS);
    version = 7;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}