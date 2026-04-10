import type { TrailError } from "../../core/errors.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { findTaskFileById, loadAllTasks } from "../../core/task-store.js";
import type { Task } from "../../schemas/task.js";
import { printJson } from "../json.js";

/** Compact task packet for LLM prompts (design: “context packet”). */
export function buildContextPacket(
  task: Task,
  allTasks: Task[],
): Record<string, unknown> {
  const depTasks = task.depends_on
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t !== undefined);

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    goal: task.ai?.summary ?? task.description,
    depends_on: task.depends_on,
    depends_on_titles: Object.fromEntries(
      depTasks.map((t) => [t.id, t.title]),
    ),
    implementation_context: task.ai?.implementation_context ?? [],
    constraints: task.ai?.constraints ?? [],
    definition_of_done: task.ai?.acceptance_criteria ?? [],
    test_strategy: task.ai?.test_strategy ?? [],
    refs: task.refs,
    github: task.github,
  };
}

export function runContext(options: { id: string }): void {
  const root = findTrailRoot(process.cwd());
  if (root === null) {
    const err: TrailError = {
      code: "NOT_A_TRAIL_REPO",
      message:
        "Not a Trail repository (missing .trail/config.json). Run `trail init` first.",
      path: process.cwd(),
    };
    throw err;
  }
  const paths = trailPaths(root);
  const resolved = findTaskFileById(paths.tasksDir, options.id);
  if (resolved === null) {
    throw new Error(`No task with id "${options.id}"`);
  }
  const allTasks = loadAllTasks(paths.tasksDir);
  printJson(buildContextPacket(resolved.task, allTasks));
}
