import type { SqliteDatabase } from "../db/types.js";
import type { BoardColumnId } from "./columns.js";
import type { IssueSyncConflictRecord, IssueSyncConflictSide } from "./sync-conflict-types.js";

type ConflictRow = {
  workspace_id: string;
  issue_number: number;
  title: string;
  github_state: string;
  trail_state: string;
  github_board_column: string;
  trail_board_column: string;
  github_labels_json: string;
  trail_labels_json: string;
  github_updated_at: string;
  trail_updated_at: string;
  detected_at: string;
  github_assignee_login: string | null;
  trail_assignee_login: string | null;
};

function parseSide(
  state: string,
  boardColumn: string,
  labelsJson: string,
  updatedAt: string,
  assigneeLogin: string | null | undefined,
): IssueSyncConflictSide {
  return {
    state,
    boardColumn: boardColumn as BoardColumnId,
    labels: JSON.parse(labelsJson) as string[],
    assigneeLogin: assigneeLogin ?? null,
    updatedAt,
  };
}

function mapRow(row: ConflictRow): IssueSyncConflictRecord {
  return {
    workspaceId: row.workspace_id,
    issueNumber: row.issue_number,
    title: row.title,
    github: parseSide(
      row.github_state,
      row.github_board_column,
      row.github_labels_json,
      row.github_updated_at,
      row.github_assignee_login,
    ),
    trail: parseSide(
      row.trail_state,
      row.trail_board_column,
      row.trail_labels_json,
      row.trail_updated_at,
      row.trail_assignee_login,
    ),
    detectedAt: row.detected_at,
  };
}

function rowFromRecord(record: IssueSyncConflictRecord): ConflictRow {
  return {
    workspace_id: record.workspaceId,
    issue_number: record.issueNumber,
    title: record.title,
    github_state: record.github.state,
    trail_state: record.trail.state,
    github_board_column: record.github.boardColumn,
    trail_board_column: record.trail.boardColumn,
    github_labels_json: JSON.stringify(record.github.labels),
    trail_labels_json: JSON.stringify(record.trail.labels),
    github_updated_at: record.github.updatedAt,
    trail_updated_at: record.trail.updatedAt,
    detected_at: record.detectedAt,
    github_assignee_login: record.github.assigneeLogin,
    trail_assignee_login: record.trail.assigneeLogin,
  };
}

export class IssueSyncConflictStore {
  constructor(private readonly db: SqliteDatabase) {}

  listByWorkspace(workspaceId: string): IssueSyncConflictRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM issue_sync_conflicts WHERE workspace_id = ? ORDER BY issue_number ASC",
      )
      .all(workspaceId) as ConflictRow[];
    return rows.map(mapRow);
  }

  get(workspaceId: string, issueNumber: number): IssueSyncConflictRecord | null {
    const row = this.db
      .prepare(
        "SELECT * FROM issue_sync_conflicts WHERE workspace_id = ? AND issue_number = ?",
      )
      .get(workspaceId, issueNumber) as ConflictRow | undefined;
    return row ? mapRow(row) : null;
  }

  countByWorkspace(workspaceId: string): number {
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM issue_sync_conflicts WHERE workspace_id = ?",
      )
      .get(workspaceId) as { count: number };
    return row.count;
  }

  replaceWorkspaceConflicts(workspaceId: string, conflicts: IssueSyncConflictRecord[]): void {
    const del = this.db.prepare(
      "DELETE FROM issue_sync_conflicts WHERE workspace_id = ?",
    );
    const insert = this.db.prepare(`
      INSERT INTO issue_sync_conflicts (
        workspace_id, issue_number, title,
        github_state, trail_state,
        github_board_column, trail_board_column,
        github_labels_json, trail_labels_json,
        github_updated_at, trail_updated_at,
        github_assignee_login, trail_assignee_login,
        detected_at
      ) VALUES (
        @workspaceId, @issueNumber, @title,
        @githubState, @trailState,
        @githubBoardColumn, @trailBoardColumn,
        @githubLabelsJson, @trailLabelsJson,
        @githubUpdatedAt, @trailUpdatedAt,
        @githubAssigneeLogin, @trailAssigneeLogin,
        @detectedAt
      )
    `);

    const tx = this.db.transaction(() => {
      del.run(workspaceId);
      for (const record of conflicts) {
        const row = rowFromRecord(record);
        insert.run({
          workspaceId: row.workspace_id,
          issueNumber: row.issue_number,
          title: row.title,
          githubState: row.github_state,
          trailState: row.trail_state,
          githubBoardColumn: row.github_board_column,
          trailBoardColumn: row.trail_board_column,
          githubLabelsJson: row.github_labels_json,
          trailLabelsJson: row.trail_labels_json,
          githubUpdatedAt: row.github_updated_at,
          trailUpdatedAt: row.trail_updated_at,
          githubAssigneeLogin: row.github_assignee_login,
          trailAssigneeLogin: row.trail_assignee_login,
          detectedAt: row.detected_at,
        });
      }
    });
    tx();
  }

  mergeWorkspaceConflicts(
    workspaceId: string,
    incoming: IssueSyncConflictRecord[],
  ): void {
    const existing = new Map(
      this.listByWorkspace(workspaceId).map((row) => [row.issueNumber, row]),
    );
    for (const record of incoming) {
      existing.set(record.issueNumber, record);
    }
    this.replaceWorkspaceConflicts(workspaceId, [...existing.values()]);
  }

  deleteConflict(workspaceId: string, issueNumber: number): void {
    this.db
      .prepare(
        "DELETE FROM issue_sync_conflicts WHERE workspace_id = ? AND issue_number = ?",
      )
      .run(workspaceId, issueNumber);
  }
}

export function openIssueSyncConflictStore(db: SqliteDatabase): IssueSyncConflictStore {
  return new IssueSyncConflictStore(db);
}