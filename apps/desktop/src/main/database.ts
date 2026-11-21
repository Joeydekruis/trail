import Database from "better-sqlite3";
import { join } from "node:path";
import { app } from "electron";
import { seedE2eFixtures, shouldApplyE2eFixtures } from "./e2e-fixtures";
import { setSqliteDatabasePath } from "./database-path";
import {
  MemorySqlite,
  openDecisionStore,
  openDecisionConflictStore,
  openIssueCacheStore,
  openIssueSyncConflictStore,
  openKnowledgeDocStore,
  openPreviewPinStore,
  openWorktreeStore,
  openWorkspaceStore,
  type DecisionConflictStore,
  type DecisionStore,
  type IssueCacheStore,
  type IssueSyncConflictStore,
  type KnowledgeDocStore,
  type PreviewPinStore,
  type SqliteDatabase,
  type WorktreeStore,
  type WorkspaceStore,
} from "@trail/core";

let store: WorkspaceStore | null = null;
let issueStore: IssueCacheStore | null = null;
let issueSyncConflictStore: IssueSyncConflictStore | null = null;
let worktreeStore: WorktreeStore | null = null;
let previewPinStore: PreviewPinStore | null = null;
let knowledgeDocStore: KnowledgeDocStore | null = null;
let decisionStore: DecisionStore | null = null;
let decisionConflictStore: DecisionConflictStore | null = null;

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

export function getIssueSyncConflictStore(): IssueSyncConflictStore {
  if (!issueSyncConflictStore) {
    throw new Error("Issue sync conflict store not initialized");
  }
  return issueSyncConflictStore;
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

export function getKnowledgeDocStore(): KnowledgeDocStore {
  if (!knowledgeDocStore) {
    throw new Error("Knowledge doc store not initialized");
  }
  return knowledgeDocStore;
}

export function getDecisionStore(): DecisionStore {
  if (!decisionStore) {
    throw new Error("Decision store not initialized");
  }
  return decisionStore;
}

export function getDecisionConflictStore(): DecisionConflictStore {
  if (!decisionConflictStore) {
    throw new Error("Decision conflict store not initialized");
  }
  return decisionConflictStore;
}

function openStores(db: SqliteDatabase, label: string): void {
  store = openWorkspaceStore(db);
  issueStore = openIssueCacheStore(db);
  issueSyncConflictStore = openIssueSyncConflictStore(db);
  worktreeStore = openWorktreeStore(db);
  previewPinStore = openPreviewPinStore(db);
  knowledgeDocStore = openKnowledgeDocStore(db);
  decisionStore = openDecisionStore(db);
  decisionConflictStore = openDecisionConflictStore(db);
  if (shouldApplyE2eFixtures()) {
    seedE2eFixtures(db, issueStore, worktreeStore);
    console.info("[trail] E2E fixtures seeded");
  }
  console.info("[trail] workspace cache:", label);
}

export function initDatabase(): void {
  try {
    const dbPath = join(app.getPath("userData"), "trail.sqlite");
    setSqliteDatabasePath(dbPath);
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    openStores(db as unknown as SqliteDatabase, dbPath);
  } catch (error) {
    setSqliteDatabasePath(null);
    console.warn("[trail] SQLite unavailable — in-memory demo cache. Run npm run bootstrap:desktop to fix better-sqlite3:", error);
    openStores(new MemorySqlite(), "memory");
  }
}