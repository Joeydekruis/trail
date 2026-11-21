import type { SqliteDatabase } from "../db/types.js";
import { defaultDecisionSeed } from "./seed.js";
import type { DecisionRecord, DecisionStatus, DecisionSummary } from "./types.js";

type DecisionRow = {
  id: string;
  workspace_id: string;
  adr_id: string;
  title: string;
  status: string;
  context_markdown: string;
  decision_markdown: string;
  consequences_markdown: string;
  author: string;
  blocks_issue_number: number | null;
  updated_at: string;
};

function mapRow(row: DecisionRow): DecisionRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    adrId: row.adr_id,
    title: row.title,
    status: row.status as DecisionStatus,
    contextMarkdown: row.context_markdown,
    decisionMarkdown: row.decision_markdown,
    consequencesMarkdown: row.consequences_markdown,
    author: row.author,
    blocksIssueNumber: row.blocks_issue_number,
    updatedAt: row.updated_at,
  };
}

export class DecisionStore {
  constructor(private readonly db: SqliteDatabase) {}

  private count(workspaceId: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM decisions WHERE workspace_id = ?")
      .get(workspaceId) as { count: number } | undefined;
    return row?.count ?? 0;
  }

  ensureSeeded(workspaceId: string): void {
    if (this.count(workspaceId) > 0) {
      return;
    }
    for (const record of defaultDecisionSeed(workspaceId)) {
      this.upsert(record);
    }
  }

  listRecords(workspaceId: string): DecisionRecord[] {
    this.ensureSeeded(workspaceId);
    const rows = this.db
      .prepare("SELECT * FROM decisions WHERE workspace_id = ? ORDER BY adr_id DESC")
      .all(workspaceId) as DecisionRow[];
    return rows.map(mapRow);
  }

  list(workspaceId: string): DecisionSummary[] {
    this.ensureSeeded(workspaceId);
    const rows = this.db
      .prepare(
        `SELECT adr_id, title, status, author, updated_at, blocks_issue_number
         FROM decisions WHERE workspace_id = ? ORDER BY adr_id DESC`,
      )
      .all(workspaceId) as Array<{
      adr_id: string;
      title: string;
      status: string;
      author: string;
      updated_at: string;
      blocks_issue_number: number | null;
    }>;
    return rows.map((row) => ({
      adrId: row.adr_id,
      title: row.title,
      status: row.status as DecisionStatus,
      author: row.author,
      updatedAt: row.updated_at,
      blocksIssueNumber: row.blocks_issue_number,
    }));
  }

  get(workspaceId: string, adrId: string): DecisionRecord | null {
    this.ensureSeeded(workspaceId);
    const row = this.db
      .prepare("SELECT * FROM decisions WHERE workspace_id = ? AND adr_id = ?")
      .get(workspaceId, adrId) as DecisionRow | undefined;
    return row ? mapRow(row) : null;
  }

  listProposedBlocking(workspaceId: string): DecisionRecord[] {
    this.ensureSeeded(workspaceId);
    const rows = this.db
      .prepare(
        `SELECT * FROM decisions WHERE workspace_id = ? AND status = 'proposed'
         AND blocks_issue_number IS NOT NULL`,
      )
      .all(workspaceId) as DecisionRow[];
    return rows.map(mapRow);
  }

  upsert(record: DecisionRecord): DecisionRecord {
    this.db
      .prepare(
        `
      INSERT INTO decisions (
        id, workspace_id, adr_id, title, status,
        context_markdown, decision_markdown, consequences_markdown,
        author, blocks_issue_number, updated_at
      ) VALUES (
        @id, @workspaceId, @adrId, @title, @status,
        @contextMarkdown, @decisionMarkdown, @consequencesMarkdown,
        @author, @blocksIssueNumber, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        context_markdown = excluded.context_markdown,
        decision_markdown = excluded.decision_markdown,
        consequences_markdown = excluded.consequences_markdown,
        author = excluded.author,
        blocks_issue_number = excluded.blocks_issue_number,
        updated_at = excluded.updated_at
    `,
      )
      .run({
        id: record.id,
        workspaceId: record.workspaceId,
        adrId: record.adrId,
        title: record.title,
        status: record.status,
        contextMarkdown: record.contextMarkdown,
        decisionMarkdown: record.decisionMarkdown,
        consequencesMarkdown: record.consequencesMarkdown,
        author: record.author,
        blocksIssueNumber: record.blocksIssueNumber,
        updatedAt: record.updatedAt,
      });
    return record;
  }

  accept(workspaceId: string, adrId: string): DecisionRecord | null {
    const current = this.get(workspaceId, adrId);
    if (!current || current.status !== "proposed") {
      return null;
    }
    const updated: DecisionRecord = {
      ...current,
      status: "accepted",
      blocksIssueNumber: null,
      updatedAt: new Date().toISOString(),
    };
    return this.upsert(updated);
  }

  reject(workspaceId: string, adrId: string): DecisionRecord | null {
    const current = this.get(workspaceId, adrId);
    if (!current || current.status !== "proposed") {
      return null;
    }
    const updated: DecisionRecord = {
      ...current,
      status: "rejected",
      blocksIssueNumber: null,
      updatedAt: new Date().toISOString(),
    };
    return this.upsert(updated);
  }

  markSuperseded(workspaceId: string, adrId: string, note?: string): DecisionRecord | null {
    const current = this.get(workspaceId, adrId);
    if (!current || current.status !== "accepted") {
      return null;
    }
    const consequences = note
      ? `${current.consequencesMarkdown}\n\n${note}`.trim()
      : current.consequencesMarkdown;
    const updated: DecisionRecord = {
      ...current,
      status: "superseded",
      consequencesMarkdown: consequences,
      updatedAt: new Date().toISOString(),
    };
    return this.upsert(updated);
  }

  appendConsequences(workspaceId: string, adrId: string, note: string): DecisionRecord | null {
    const current = this.get(workspaceId, adrId);
    if (!current || current.status !== "accepted") {
      return null;
    }
    const consequences = `${current.consequencesMarkdown}\n\n${note}`.trim();
    const updated: DecisionRecord = {
      ...current,
      consequencesMarkdown: consequences,
      updatedAt: new Date().toISOString(),
    };
    return this.upsert(updated);
  }
}

export function openDecisionStore(db: SqliteDatabase): DecisionStore {
  return new DecisionStore(db);
}