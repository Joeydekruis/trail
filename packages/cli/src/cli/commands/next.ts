import { selectNextTask } from "../../core/next-task.js";
import { printJson } from "../json.js";
import { loadTrailReadContext } from "../read-context.js";

export type NextOptions = {
  json?: boolean;
};

export async function runNext(options: NextOptions): Promise<void> {
  const { tasks } = await loadTrailReadContext(process.cwd());
  const next = selectNextTask(tasks);

  if (next === null) {
    if (options.json) {
      printJson(null);
    } else {
      console.log("No eligible next task.");
    }
    return;
  }

  if (options.json) {
    printJson(next);
    return;
  }

  const pri = next.priority ?? "—";
  console.log(`Next: ${next.id} — ${next.title} (${next.status}, ${pri})`);
}
