import { printJson } from "../json.js";
import { loadTrailReadContext } from "../read-context.js";

export type ShowOptions = {
  id: string;
  json?: boolean;
};

export async function runShow(options: ShowOptions): Promise<void> {
  const { tasks } = await loadTrailReadContext(process.cwd());
  const task = tasks.find((t) => t.id === options.id);
  if (task === undefined) {
    throw new Error(`No task with id "${options.id}"`);
  }

  if (options.json) {
    printJson(task);
    return;
  }

  console.log(`${task.id}  ${task.status}  ${task.title}`);
  if (task.description) {
    console.log();
    console.log(task.description);
  }
}
