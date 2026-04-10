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
