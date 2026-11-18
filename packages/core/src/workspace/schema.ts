import type { SqliteDatabase } from "../db/types.js";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_label TEXT NOT NULL,
  repository TEXT,
  integration_branch TEXT NOT NULL DEFAULT 'development',
  sort_order INTEGER NOT NULL DEFAULT 0,
  accent TEXT NOT NULL,
  accent_soft TEXT NOT NULL,
  accent_line TEXT NOT NULL,
  on_accent TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const DEMO_WORKSPACES = [
  {
    id: "trail",
    name: "Trail",
    shortLabel: "T",
    repository: null,
    integrationBranch: "development",
    sortOrder: 0,
    accent: "#4af7a3",
    accentSoft: "#0f2219",
    accentLine: "#1c4733",
    onAccent: "#04140c",
  },
  {
    id: "loupe",
    name: "Loupe",
    shortLabel: "L",
    repository: null,
    integrationBranch: "development",
    sortOrder: 1,
    accent: "#b26bff",
    accentSoft: "#1b1230",
    accentLine: "#3b2766",
    onAccent: "#12071f",
  },
  {
    id: "dockyrd",
    name: "Dockyrd",
    shortLabel: "D",
    repository: null,
    integrationBranch: "development",
    sortOrder: 2,
    accent: "#3dd6f5",
    accentSoft: "#0e2229",
    accentLine: "#1b4553",
    onAccent: "#04141a",
  },
] as const;

const ACTIVE_KEY = "active_workspace_id";

export function migrateAndSeed(db: SqliteDatabase): void {
  db.exec(SCHEMA_SQL);

  const version =
    (
      db
        .prepare("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
        .get() as { version: number } | undefined
    )?.version ?? 0;

  if (version < 1) {
    db.prepare("DELETE FROM schema_version").run();
    db.prepare("INSERT INTO schema_version (version) VALUES (1)").run();
  }

  const count = (
    db.prepare("SELECT COUNT(*) as count FROM workspaces").get() as {
      count: number;
    }
  ).count;

  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO workspaces (
        id, name, short_label, repository, integration_branch, sort_order,
        accent, accent_soft, accent_line, on_accent
      ) VALUES (
        @id, @name, @shortLabel, @repository, @integrationBranch, @sortOrder,
        @accent, @accentSoft, @accentLine, @onAccent
      )
    `);

    const tx = db.transaction(() => {
      for (const ws of DEMO_WORKSPACES) {
        insert.run(ws);
      }
      db.prepare(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      ).run(ACTIVE_KEY, DEMO_WORKSPACES[0].id);
    });
    tx();
  }
}