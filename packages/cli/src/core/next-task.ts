import type { Task } from "../schemas/task.js";

const TERMINAL: ReadonlySet<Task["status"]> = new Set(["done", "cancelled"]);

function priorityRank(p: Task["priority"]): number {
  switch (p) {
    case "p0":
      return 0;
    case "p1":
      return 1;
    case "p2":
      return 2;
    case "p3":
      return 3;
    default:
      return 4;
  }
}

/** Exported for tests and any CLI that needs consistent id ordering. */
export function compareTaskIds(a: string, b: string): number {
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    const ba = BigInt(a);
    const bb = BigInt(b);
    return ba < bb ? -1 : ba > bb ? 1 : 0;
  }
  return a.localeCompare(b);
}

function dependencyResolved(dep: Task | undefined): boolean {
  if (dep === undefined) {
    return false;
  }
  return TERMINAL.has(dep.status);
}

export function isTaskBlocked(task: Task, byId: Map<string, Task>): boolean {
  for (const depId of task.depends_on) {
    if (!dependencyResolved(byId.get(depId))) {
      return true;
    }
  }
  return false;
}

/**
 * Picks the next actionable task: not done/cancelled, not blocked by open
 * dependencies, highest priority (p0 first), then lowest id.
 */
export function selectNextTask(tasks: Task[]): Task | null {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const candidates = tasks.filter(
    (t) => !TERMINAL.has(t.status) && !isTaskBlocked(t, byId),
  );
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) {
      return pr;
    }
    return compareTaskIds(a.id, b.id);
  });

  return candidates[0] ?? null;
}
