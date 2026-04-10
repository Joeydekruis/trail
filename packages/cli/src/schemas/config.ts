import { z } from "zod";

export const TrailConfigSchema = z
  .object({
    github: z
      .object({
        owner: z.string(),
        repo: z.string(),
      })
      .strict(),
    sync: z
      .object({
        preset: z.enum(["collaborative", "solo", "offline"]),
        auto_sync_on_command: z.boolean(),
        ui_poll_interval_seconds: z.number(),
        ui_idle_backoff: z.boolean(),
      })
      .strict(),
    /** Last successful full sync; useful for future `trail status` and similar. */
    last_full_sync_at: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export type TrailConfig = z.infer<typeof TrailConfigSchema>;
