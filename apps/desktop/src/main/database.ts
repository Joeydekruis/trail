import Database from "better-sqlite3";
import { join } from "node:path";
import { app } from "electron";
import {
  MemorySqlite,
  openIssueCacheStore,
  openPreviewPinStore,
  openWorktreeStore,
  openWorkspaceStore,
  type IssueCacheStore,
  type PreviewPinStore,
  type SqliteDatabase,
  type WorktreeStore,
  type WorkspaceStore,
} from "@trail/core";

let store: WorkspaceStore | null = null;
let issueStore: IssueCacheStore | null = null;
let worktreeStore: WorktreeStore | null = null;
let previewPinStore: PreviewPinStore | null = null;

export function getWorkspaceStore(): WorkspaceStore {
  if (!store) {
    throw new Error("Workspace store not initialized");
  }
  return store;
}

export function getIssueCacheStore(): IssueCacheStore {
  if (!issueStore) {
    throw new Error("Issue cache store not initialized");
  }
  return issueStore;
}

export function getWorktreeStore(): WorktreeStore {
  if (!worktreeStore) {
    throw new Error("Worktree store not initialized");
  }
  return worktreeStore;
}

export function getPreviewPinStore(): PreviewPinStore {
  if (!previewPinStore) {
    throw new Error("Preview pin store not initialized");
  }
  return previewPinStore;
}

function openStores(db: SqliteDatabase, label: string): void {
  store = openWorkspaceStore(db);
  issueStore = openIssueCacheStore(db);
  worktreeStore = openWorktreeStore(db);
  previewPinStore = openPreviewPinStore(db);
  console.info("[trail] workspace cache:", label);
}

export function initDatabase(): void {
  try {
    const dbPath = join(app.getPath("userData"), "trail.sqlite");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    openStores(db as unknown as SqliteDatabase, dbPath);
  } catch (error) {
    console.warn("[trail] SQLite unavailable — in-memory demo cache. Run npm run bootstrap:desktop to fix better-sqlite3:", error);
    openStores(new MemorySqlite(), "memory");
  }
}