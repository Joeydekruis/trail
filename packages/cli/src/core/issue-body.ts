import { z } from "zod";

import { TaskStatusSchema, type Task } from "../schemas/task.js";

/** Marker inside HTML comments: `<!-- trail:v1 ... -->` */
export const TRAIL_META_MARKER = "trail:v1";

const TRAIL_META_BLOCK_RE = /<!--\s*trail:v1\s*([\s\S]*?)\s*-->/i;

const TrailIssueMetaSchema = z
  .object({
    type: z.enum(["feature", "bug", "chore", "epic"]).optional(),
    priority: z.enum(["p0", "p1", "p2", "p3"]).optional(),
    estimate: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
    status: TaskStatusSchema.optional(),
    depends_on: z.array(z.string()).optional(),
    blocks: z.array(z.string()).optional(),
    refs: z
      .array(
        z
          .object({
            type: z.string(),
            path: z.string(),
          })
          .strict(),
      )
      .optional(),
    ai: z
      .object({
        summary: z.string().optional(),
        acceptance_criteria: z.array(z.string()).optional(),
        implementation_context: z.array(z.string()).optional(),
        test_strategy: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
      })
      .strict()
      .optional(),
    branch: z.string().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    parent: z.string().nullable().optional(),
  })
  .strict();

export type TrailIssueMeta = z.infer<typeof TrailIssueMetaSchema>;

export type ParsedIssueBody = {
  description: string;
  meta: TrailIssueMeta;
};

const PRIORITY_LABEL_RE = /^priority:(p[0-3])$/;

/** Labels Trail manages via the meta block or explicit priority mapping. */
export function stripTrailManagedLabels(labels: string[]): string[] {
  return labels.filter((name) => !PRIORITY_LABEL_RE.test(name));
}

export function priorityFromLabels(labels: string[]): Task["priority"] | undefined {
  for (const name of labels) {
    const m = PRIORITY_LABEL_RE.exec(name);
    if (m) {
      return m[1] as Task["priority"];
    }
  }
  return undefined;
}

export function parseIssueBody(body: string | null | undefined): ParsedIssueBody {
  const raw = body ?? "";
  const match = TRAIL_META_BLOCK_RE.exec(raw);
  if (!match) {
    return { description: raw.trim(), meta: {} };
  }

  const description = raw.slice(0, match.index).replace(/\n---\s*$/m, "").trim();
  const jsonText = match[1]?.trim() ?? "{}";

  let meta: TrailIssueMeta = {};
  if (jsonText.length > 0) {
    try {
      const parsed = TrailIssueMetaSchema.safeParse(JSON.parse(jsonText));
      if (parsed.success) {
        meta = parsed.data;
      }
    } catch {
      meta = {};
    }
  }

  return { description, meta };
}

export function metaFromTask(task: Task): TrailIssueMeta {
  const meta: TrailIssueMeta = {
    type: task.type,
    depends_on: task.depends_on,
    blocks: task.blocks,
    refs: task.refs,
  };

  if (task.priority !== undefined) meta.priority = task.priority;
  if (task.estimate !== undefined) meta.estimate = task.estimate;
  if (task.status !== undefined) meta.status = task.status;
  if (task.branch !== undefined) meta.branch = task.branch;
  if (task.start_date !== undefined) meta.start_date = task.start_date;
  if (task.due_date !== undefined) meta.due_date = task.due_date;
  if (task.parent !== undefined) meta.parent = task.parent;
  if (task.ai !== undefined) meta.ai = task.ai;

  return meta;
}

export function composeIssueBody(description: string, meta: TrailIssueMeta): string {
  const desc = description.trim();
  const hasMeta = Object.keys(meta).length > 0;
  if (!hasMeta) {
    return desc;
  }

  const json = JSON.stringify(meta, null, 2);
  const block = `<!-- ${TRAIL_META_MARKER}\n${json}\n-->`;

  if (desc.length === 0) {
    return block;
  }

  return `${desc}\n\n---\n\n${block}`;
}
