import { z } from "zod";

export const TaskStatusSchema = z.enum([
  "draft",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
]);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

/** YYYY-MM-DD (ISO 8601 calendar date). */
const isoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected ISO date string (YYYY-MM-DD)");

/**
 * GitHub issue link metadata. `null` means the task is not linked to an issue (e.g. local draft).
 */
const TaskGitHubSchema = z
  .object({
    issue_number: z.number().int(),
    synced_at: z.string().datetime({ offset: true }),
    url: z.string().url(),
  })
  .nullable();

const TaskAiSchema = z
  .object({
    summary: z.string().optional(),
    acceptance_criteria: z.array(z.string()).optional(),
    implementation_context: z.array(z.string()).optional(),
    test_strategy: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
  })
  .strict()
  .optional();

export const TaskSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    status: TaskStatusSchema,
    priority: z.enum(["p0", "p1", "p2", "p3"]).optional(),
    type: z.enum(["feature", "bug", "chore", "epic"]),
    assignee: z.string().optional(),
    milestone: z.string().optional(),
    branch: z.string().optional(),
    labels: z.array(z.string()).default([]),
    parent: z.string().nullable().optional(),
    depends_on: z.array(z.string()).default([]),
    blocks: z.array(z.string()).default([]),
    due_date: isoDateStringSchema.optional(),
    start_date: isoDateStringSchema.optional(),
    estimate: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
    github: TaskGitHubSchema.optional(),
    refs: z
      .array(
        z
          .object({
            type: z.string(),
            path: z.string(),
          })
          .strict(),
      )
      .default([]),
    ai: TaskAiSchema,
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict();

export type Task = z.infer<typeof TaskSchema>;
