import { TaskStatusSchema } from "../../schemas/task.js";
import { printJson } from "../json.js";
import { loadTrailReadContext } from "../read-context.js";

export type StatusOptions = {
  json?: boolean;
};

export async function runStatus(options: StatusOptions): Promise<void> {
  const { config, tasks } = await loadTrailReadContext(process.cwd());

  const counts: Record<string, number> = {};
  for (const s of TaskStatusSchema.options) {
    counts[s] = 0;
  }
  for (const t of tasks) {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }

  const payload: {
    counts: Record<string, number>;
    last_full_sync_at?: string;
  } = { counts };
  if (config.last_full_sync_at !== undefined) {
    payload.last_full_sync_at = config.last_full_sync_at;
  }

  if (options.json) {
    printJson(payload);
    return;
  }

  console.log("Tasks by status:");
  for (const s of TaskStatusSchema.options) {
    console.log(`  ${s}: ${counts[s] ?? 0}`);
  }
  if (config.last_full_sync_at !== undefined) {
    console.log(`Last full sync: ${config.last_full_sync_at}`);
  } else {
    console.log("Last full sync: (not recorded)");
  }
}
