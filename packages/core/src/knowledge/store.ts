import type { SqliteDatabase } from "../db/types.js";
import { defaultKnowledgeSeed } from "./seed.js";
import { knowledgeDocId, slugFromTitle } from "./slug.js";
import type { KnowledgeDocRecord, KnowledgeDocSummary } from "./types.js";

type DocRow = {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  body_markdown: string;
  updated_at: string;
};

function mapRow(row: DocRow): KnowledgeDocRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    slug: row.slug,
    title: row.title,
    bodyMarkdown: row.body_markdown,
    updatedAt: row.updated_at,
  };
}

export class KnowledgeDocStore {
  constructor(private readonly db: SqliteDatabase) {}

  private count(workspaceId: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM knowledge_docs WHERE workspace_id = ?")
      .get(workspaceId) as { count: number } | undefined;
    return row?.count ?? 0;
  }

  ensureSeeded(workspaceId: string): void {
    if (this.count(workspaceId) > 0) {
      return;
    }
    for (const doc of defaultKnowledgeSeed(workspaceId)) {
      this.upsert(doc);
    }
  }

  list(workspaceId: string): KnowledgeDocSummary[] {
    this.ensureSeeded(workspaceId);
    const rows = this.db
      .prepare(
        "SELECT slug, title, updated_at FROM knowledge_docs WHERE workspace_id = ? ORDER BY title",
      )
      .all(workspaceId) as Array<{ slug: string; title: string; updated_at: string }>;
    return rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      updatedAt: row.updated_at,
    }));
  }

  get(workspaceId: string, slug: string): KnowledgeDocRecord | null {
    const row = this.db
      .prepare("SELECT * FROM knowledge_docs WHERE workspace_id = ? AND slug = ?")
      .get(workspaceId, slug) as DocRow | undefined;
    return row ? mapRow(row) : null;
  }

  upsert(record: KnowledgeDocRecord): KnowledgeDocRecord {
    this.db
      .prepare(
        `
      INSERT INTO knowledge_docs (id, workspace_id, slug, title, body_markdown, updated_at)
      VALUES (@id, @workspaceId, @slug, @title, @bodyMarkdown, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        body_markdown = excluded.body_markdown,
        updated_at = excluded.updated_at
    `,
      )
      .run({
        id: record.id,
        workspaceId: record.workspaceId,
        slug: record.slug,
        title: record.title,
        bodyMarkdown: record.bodyMarkdown,
        updatedAt: record.updatedAt,
      });
    return record;
  }

  save(input: {
    workspaceId: string;
    slug?: string;
    title: string;
    bodyMarkdown: string;
  }): KnowledgeDocRecord {
    const slug = input.slug?.trim() || slugFromTitle(input.title);
    const updatedAt = new Date().toISOString();
    const record: KnowledgeDocRecord = {
      id: knowledgeDocId(input.workspaceId, slug),
      workspaceId: input.workspaceId,
      slug,
      title: input.title.trim(),
      bodyMarkdown: input.bodyMarkdown,
      updatedAt,
    };
    return this.upsert(record);
  }
}

export function openKnowledgeDocStore(db: SqliteDatabase): KnowledgeDocStore {
  return new KnowledgeDocStore(db);
}