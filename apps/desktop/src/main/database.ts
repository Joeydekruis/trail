import Database from "better-sqlite3";
import { join } from "node:path";
import { app } from "electron";
import {
  openWorkspaceStore,
  type SqliteDatabase,
  type WorkspaceStore,
} from "@trail/core";

let store: WorkspaceStore | null = null;

export function getWorkspaceStore(): WorkspaceStore {
  if (!store) {
    throw new Error("Workspace store not initialized");
  }
  return store;
}

export function initDatabase(): void {
  const dbPath = join(app.getPath("userData"), "trail.sqlite");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  store = openWorkspaceStore(db as unknown as SqliteDatabase);
}