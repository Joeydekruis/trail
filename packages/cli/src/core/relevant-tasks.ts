import type { Task, TaskStatus } from "../schemas/task.js";

const NON_TERMINAL: TaskStatus[] = [
  "draft",
  "todo",
  "in_progress",
  "in_review",
];

function isNonTerminalStatus(status: TaskStatus): boolean {
  return NON_TERMINAL.includes(status);
}

/**
 * Tasks that are "in play" for day-to-day work: not done/cancelled.
 * Used as seeds for the relevance closure.
 */
export function isActiveForRelevance(task: Task): boolean {
  return isNonTerminalStatus(task.status);
}

/**
 * Collects task ids that are active (non-terminal) plus any task ids reachable via
 * `depends_on`, `blocks`, or `parent` from those seeds. Used to limit bulk `push`
 * during `trail sync` so we do not PATCH every linked issue in the repository.
 *
 * Individual commands (`trail update`, `trail done`, …) still push their target task.
 */
export function computeRelevantTaskIds(tasks: Task[]): Set<string> {
  const byId = new Map<string, Task>();
  for (const t of tasks) {
    byId.set(t.id, t);
  }

  const relevant = new Set<string>();
  const queue: string[] = [];

  for (const t of tasks) {
    if (isActiveForRelevance(t)) {
      if (!relevant.has(t.id)) {
        relevant.add(t.id);
        queue.push(t.id);
      }
    }
  }

  function enqueue(id: string): void {
    if (relevant.has(id)) return;
    relevant.add(id);
    queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.pop() as string;
    const task = byId.get(id);
    if (!task) continue;

    for (const d of task.depends_on) {
      if (byId.has(d)) enqueue(d);
    }
    for (const b of task.blocks) {
      if (byId.has(b)) enqueue(b);
    }
    if (task.parent != null && task.parent !== "" && byId.has(task.parent)) {
      enqueue(task.parent);
    }
  }

  return relevant;
}
