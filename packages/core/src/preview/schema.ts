import type { SqliteDatabase } from "../db/types.js";

const CREATE_PREVIEW_PINS = `
CREATE TABLE IF NOT EXISTS preview_pins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workspace_id TEXT NOT NULL,
  issue_number INTEGER NOT NULL,
  pin_number INTEGER NOT NULL,
  comment TEXT NOT NULL,
  page_url TEXT NOT NULL,
  selector TEXT NOT NULL,
  xpath TEXT NOT NULL,
  element_text TEXT NOT NULL,
  offset_x REAL NOT NULL,
  offset_y REAL NOT NULL,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(workspace_id, issue_number, pin_number)
);
`;

/** Schema version 6 — preview pin anchors per worktree. */
export function migratePreviewPins(db: SqliteDatabase, schemaVersion: number): number {
  let version = schemaVersion;
  if (version < 6) {
    db.exec(CREATE_PREVIEW_PINS);
    version = 6;
  }
  if (version > schemaVersion) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (?)").run(version);
  }
  return version;
}