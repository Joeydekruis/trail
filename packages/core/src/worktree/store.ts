import type { SqliteDatabase } from "../db/types.js";
import type { WorktreeRecord, WorktreeStatus } from "./types.js";

type WorktreeRow = {
  id: string;
  workspace_id: string;
  issue_number: number;
  title: string;
  branch: string;
  path: string;
  status: string;
  is_remote: number;
  created_at: string;
  pull_request_url: string | null;
};

function mapRow(row: WorktreeRow): WorktreeRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    issueNumber: row.issue_number,
    title: row.title,
    branch: row.branch,
    path: row.path,
    status: row.status as WorktreeStatus,
    isRemote: row.is_remote === 1,
    createdAt: row.created_at,
    pullRequestUrl: row.pull_request_url ?? null,
  };
}

export function worktreeId(workspaceId: string, issueNumber: number): string {
  return `${workspaceId}:${issueNumber}`;
}

export class WorktreeStore {
  constructor(private readonly db: SqliteDatabase) {}

  listByWorkspace(workspaceId: string): WorktreeRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM worktrees WHERE workspace_id = ? ORDER BY issue_number DESC",
      )
      .all(workspaceId) as WorktreeRow[];
    return rows.map(mapRow);
  }

  get(workspaceId: string, issueNumber: number): WorktreeRecord | null {
    const row = this.db
      .prepare(
        "SELECT * FROM worktrees WHERE workspace_id = ? AND issue_number = ?",
      )
      .get(workspaceId, issueNumber) as WorktreeRow | undefined;
    return row ? mapRow(row) : null;
  }

  updateStatus(
    workspaceId: string,
    issueNumber: number,
    status: WorktreeStatus,
  ): WorktreeRecord | null {
    const current = this.get(workspaceId, issueNumber);
    if (!current) {
      return null;
    }
    const next = { ...current, status };
    this.upsert(next);
    return next;
  }

  upsert(record: WorktreeRecord): void {
    this.db
      .prepare(
        `
      INSERT INTO worktrees (
        id, workspace_id, issue_number, title, branch, path, status, is_remote, created_at, pull_request_url
      ) VALUES (
        @id, @workspaceId, @issueNumber, @title, @branch, @path, @status, @isRemote, @createdAt, @pullRequestUrl
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        branch = excluded.branch,
        path = excluded.path,
        status = excluded.status,
        is_remote = excluded.is_remote,
        pull_request_url = COALESCE(excluded.pull_request_url, worktrees.pull_request_url)
    `,
      )
      .run({
        id: record.id,
        workspaceId: record.workspaceId,
        issueNumber: record.issueNumber,
        title: record.title,
        branch: record.branch,
        path: record.path,
        status: record.status,
        isRemote: record.isRemote ? 1 : 0,
        createdAt: record.createdAt,
        pullRequestUrl: record.pullRequestUrl,
      });
  }
}

export function openWorktreeStore(db: SqliteDatabase): WorktreeStore {
  return new WorktreeStore(db);
}