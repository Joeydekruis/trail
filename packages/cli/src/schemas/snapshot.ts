import { z } from "zod";

import { TaskSchema } from "./task.js";

export const SnapshotSchema = z
  .object({
    generated_at: z.string().datetime({ offset: true }),
    tasks: z.array(TaskSchema),
    warnings: z.array(
      z
        .object({
          code: z.string(),
          message: z.string(),
          taskId: z.string().optional(),
        })
        .strict(),
    ),
  })
  .strict();

export type Snapshot = z.infer<typeof SnapshotSchema>;
