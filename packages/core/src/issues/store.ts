import type { SqliteDatabase } from "../db/types.js";
import type { IssueCacheRecord } from "./types.js";
import type { IssuePriority } from "./priority.js";
import type { BoardColumnId } from "./columns.js";

type IssueRow = {
  workspace_id: string;
  number: number;
  title: string;
  state: string;
  board_column: string;
  priority: string;
  labels_json: string;
  updated_at: string;
  html_url: string;
  body: string | null;
  assignee_login: string | null;
};

function parseRow(row: IssueRow): IssueCacheRecord {
  return {
    workspaceId: row.workspace_id,
    number: row.number,
    title: row.title,
    state: row.state,
    boardColumn: row.board_column as BoardColumnId,
    priority: row.priority as IssuePriority,
    labels: JSON.parse(row.labels_json) as string[],
    updatedAt: row.updated_at,
    htmlUrl: row.html_url,
    body: row.body ?? null,
    assigneeLogin: row.assignee_login ?? null,
  };
}

export class IssueCacheStore {
  constructor(private readonly db: SqliteDatabase) {}

  replaceWorkspaceIssues(workspaceId: string, issues: IssueCacheRecord[]): void {
    const del = this.db.prepare("DELETE FROM issue_cache WHERE workspace_id = ?");
    const insert = this.db.prepare(`
      INSERT INTO issue_cache (
        workspace_id, number, title, state, board_column, priority,
        labels_json, updated_at, html_url, body, assignee_login
      ) VALUES (
        @workspaceId, @number, @title, @state, @boardColumn, @priority,
        @labelsJson, @updatedAt, @htmlUrl, @body, @assigneeLogin
      )
    `);

    const tx = this.db.transaction(() => {
      del.run(workspaceId);
      for (const issue of issues) {
        insert.run({
          workspaceId: issue.workspaceId,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          boardColumn: issue.boardColumn,
          priority: issue.priority,
          labelsJson: JSON.stringify(issue.labels),
          updatedAt: issue.updatedAt,
          htmlUrl: issue.htmlUrl,
          body: issue.body,
          assigneeLogin: issue.assigneeLogin,
        });
      }
    });
    tx();
  }

  listByWorkspace(workspaceId: string): IssueCacheRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM issue_cache WHERE workspace_id = ? ORDER BY number ASC",
      )
      .all(workspaceId) as IssueRow[];
    return rows.map(parseRow);
  }

  get(workspaceId: string, issueNumber: number): IssueCacheRecord | null {
    const row = this.db
      .prepare("SELECT * FROM issue_cache WHERE workspace_id = ? AND number = ?")
      .get(workspaceId, issueNumber) as IssueRow | undefined;
    return row ? parseRow(row) : null;
  }

  updateBoardColumn(
    workspaceId: string,
    issueNumber: number,
    boardColumn: BoardColumnId,
    state?: string,
  ): boolean {
    if (state !== undefined) {
      const result = this.db
        .prepare(
          "UPDATE issue_cache SET board_column = ?, state = ? WHERE workspace_id = ? AND number = ?",
        )
        .run(boardColumn, state, workspaceId, issueNumber);
      return result.changes > 0;
    }
    const result = this.db
      .prepare(
        "UPDATE issue_cache SET board_column = ? WHERE workspace_id = ? AND number = ?",
      )
      .run(boardColumn, workspaceId, issueNumber);
    return result.changes > 0;
  }

  upsert(issue: IssueCacheRecord): void {
    const existing = this.get(issue.workspaceId, issue.number);
    if (!existing) {
      this.db
        .prepare(`
          INSERT INTO issue_cache (
            workspace_id, number, title, state, board_column, priority,
            labels_json, updated_at, html_url, body
          ) VALUES (
            @workspaceId, @number, @title, @state, @boardColumn, @priority,
            @labelsJson, @updatedAt, @htmlUrl, @body
          )
        `)
        .run({
          workspaceId: issue.workspaceId,
          number: issue.number,
          title: issue.title,
          state: issue.state,
          boardColumn: issue.boardColumn,
          priority: issue.priority,
          labelsJson: JSON.stringify(issue.labels),
          updatedAt: issue.updatedAt,
          htmlUrl: issue.htmlUrl,
          body: issue.body,
          assigneeLogin: issue.assigneeLogin,
        });
      return;
    }
    this.db
      .prepare(`
        UPDATE issue_cache SET
          title = @title,
          state = @state,
          board_column = @boardColumn,
          priority = @priority,
          labels_json = @labelsJson,
          updated_at = @updatedAt,
          html_url = @htmlUrl,
          body = @body,
          assignee_login = @assigneeLogin
        WHERE workspace_id = @workspaceId AND number = @number
      `)
      .run({
        workspaceId: issue.workspaceId,
        number: issue.number,
        title: issue.title,
        state: issue.state,
        boardColumn: issue.boardColumn,
        priority: issue.priority,
        labelsJson: JSON.stringify(issue.labels),
        updatedAt: issue.updatedAt,
        htmlUrl: issue.htmlUrl,
        body: issue.body,
        assigneeLogin: issue.assigneeLogin,
      });
  }

  countOpen(workspaceId: string): number {
    const row = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM issue_cache WHERE workspace_id = ? AND state = 'open'",
      )
      .get(workspaceId) as { count: number };
    return row.count;
  }
}

export function openIssueCacheStore(db: SqliteDatabase): IssueCacheStore {
  return new IssueCacheStore(db);
}