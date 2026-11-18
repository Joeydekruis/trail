import Database from "better-sqlite3";
import { join } from "node:path";
import { app } from "electron";
import {
  openInMemoryWorkspaceStore,
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
  try {
    const dbPath = join(app.getPath("userData"), "trail.sqlite");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    store = openWorkspaceStore(db as unknown as SqliteDatabase);
    console.info("[trail] workspace cache:", dbPath);
  } catch (error) {
    console.warn("[trail] SQLite unavailable — in-memory demo cache. Run npm run bootstrap:desktop to fix better-sqlite3:", error);
    store = openInMemoryWorkspaceStore();
  }
}