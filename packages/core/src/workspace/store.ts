import type { SqliteDatabase } from "../db/types.js";
import { accentForSortOrder } from "./accents.js";
import { migrateAndSeed } from "./schema.js";
import type { WorkspaceRecord } from "./types.js";
import {
  shortLabelFromName,
  workspaceIdFromRepository,
  workspaceNameFromRepository,
} from "./repository.js";
import { workspaceLastSyncKey } from "./settings.js";

export type WorkspaceCreateInput = {
  repository: string;
  name?: string;
  integrationBranch?: string;
};

const ACTIVE_KEY = "active_workspace_id";

type WorkspaceRow = {
  id: string;
  name: string;
  short_label: string;
  repository: string | null;
  integration_branch: string;
  sort_order: number;
  accent: string;
  accent_soft: string;
  accent_line: string;
  on_accent: string;
};

function mapRow(row: WorkspaceRow): WorkspaceRecord {
  return {
    id: row.id,
    name: row.name,
    shortLabel: row.short_label,
    repository: row.repository,
    integrationBranch: row.integration_branch,
    sortOrder: row.sort_order,
    accent: row.accent,
    accentSoft: row.accent_soft,
    accentLine: row.accent_line,
    onAccent: row.on_accent,
  };
}

export class WorkspaceStore {
  constructor(private readonly db: SqliteDatabase) {}

  hasLinkedWorkspace(): boolean {
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM workspaces WHERE repository IS NOT NULL",
      )
      .get() as { count: number };
    return row.count > 0;
  }

  getAppSetting(key: string): string | null {
    const row = this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  setAppSetting(key: string, value: string): void {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      )
      .run(key, value);
  }

  deleteAppSetting(key: string): void {
    this.db.prepare("DELETE FROM app_settings WHERE key = ?").run(key);
  }

  getLastSyncAt(workspaceId: string): string | null {
    return this.getAppSetting(workspaceLastSyncKey(workspaceId));
  }

  setLastSyncAt(workspaceId: string, syncedAt: string): void {
    this.setAppSetting(workspaceLastSyncKey(workspaceId), syncedAt);
  }

  list(): WorkspaceRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM workspaces ORDER BY sort_order ASC, name ASC",
      )
      .all() as WorkspaceRow[];
    return rows.map(mapRow);
  }

  getActiveId(): string {
    const row = this.db
      .prepare("SELECT value FROM app_settings WHERE key = ?")
      .get(ACTIVE_KEY) as { value: string } | undefined;
    if (row?.value) {
      return row.value;
    }
    const first = this.list()[0];
    if (!first) {
      throw new Error("No workspaces in cache");
    }
    this.setActiveId(first.id);
    return first.id;
  }

  setActiveId(workspaceId: string): void {
    const exists = this.db
      .prepare("SELECT 1 FROM workspaces WHERE id = ?")
      .get(workspaceId);
    if (!exists) {
      throw new Error(`Unknown workspace: ${workspaceId}`);
    }
    this.db
      .prepare(
        "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      )
      .run(ACTIVE_KEY, workspaceId);
  }

  getActive(): WorkspaceRecord {
    const id = this.getActiveId();
    const row = this.db
      .prepare("SELECT * FROM workspaces WHERE id = ?")
      .get(id) as WorkspaceRow | undefined;
    if (!row) {
      throw new Error(`Active workspace missing: ${id}`);
    }
    return mapRow(row);
  }

  switchTo(workspaceId: string): WorkspaceRecord {
    this.setActiveId(workspaceId);
    return this.getActive();
  }

  create(input: WorkspaceCreateInput): WorkspaceRecord {
    const repository = input.repository.trim();
    const id = workspaceIdFromRepository(repository);
    const name = input.name?.trim() || workspaceNameFromRepository(repository);
    const integrationBranch = input.integrationBranch?.trim() || "development";
    const shortLabel = shortLabelFromName(name);

    const existing = this.db.prepare("SELECT 1 FROM workspaces WHERE id = ?").get(id);
    if (existing) {
      throw new Error(`Workspace already exists: ${id}`);
    }

    const insert = this.db.prepare(`
      INSERT INTO workspaces (
        id, name, short_label, repository, integration_branch, sort_order,
        accent, accent_soft, accent_line, on_accent
      ) VALUES (
        @id, @name, @shortLabel, @repository, @integrationBranch, @sortOrder,
        @accent, @accentSoft, @accentLine, @onAccent
      )
    `);

    let created: WorkspaceRecord | undefined;
    const tx = this.db.transaction(() => {
      const linkedBefore = (
        this.db
          .prepare("SELECT COUNT(*) as count FROM workspaces WHERE repository IS NOT NULL")
          .get() as { count: number }
      ).count;

      if (linkedBefore === 0) {
        this.db.prepare("DELETE FROM workspaces WHERE repository IS NULL").run();
      }

      const maxRow = this.db
        .prepare("SELECT MAX(sort_order) as maxOrder FROM workspaces")
        .get() as { maxOrder: number | null };
      const sortOrder = (maxRow?.maxOrder ?? -1) + 1;
      const accent = accentForSortOrder(sortOrder);

      insert.run({
        id,
        name,
        shortLabel,
        repository,
        integrationBranch,
        sortOrder,
        accent: accent.accent,
        accentSoft: accent.accentSoft,
        accentLine: accent.accentLine,
        onAccent: accent.onAccent,
      });

      this.setActiveId(id);
      created = this.getActive();
    });
    tx();

    if (!created) {
      throw new Error("Failed to create workspace");
    }
    return created;
  }
}

export function openWorkspaceStore(db: SqliteDatabase): WorkspaceStore {
  migrateAndSeed(db);
  return new WorkspaceStore(db);
}