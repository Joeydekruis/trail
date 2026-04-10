import type { Task } from "../schemas/task.js";
import { findTaskFileById, writeTaskFile } from "./task-store.js";

function uniq(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Ensures `taskId` depends on `dependsOnId` and the reverse `blocks` edge exists.
 */
export function addDependency(
  tasksDir: string,
  taskId: string,
  dependsOnId: string,
  updatedAtIso: string,
): void {
  if (taskId === dependsOnId) {
    throw new Error("A task cannot depend on itself");
  }
  const a = findTaskFileById(tasksDir, taskId);
  const b = findTaskFileById(tasksDir, dependsOnId);
  if (a === null) {
    throw new Error(`No task with id "${taskId}"`);
  }
  if (b === null) {
    throw new Error(`No task with id "${dependsOnId}"`);
  }

  const nextA: Task = {
    ...a.task,
    depends_on: uniq([...a.task.depends_on, dependsOnId]),
    updated_at: updatedAtIso,
  };
  const nextB: Task = {
    ...b.task,
    blocks: uniq([...b.task.blocks, taskId]),
    updated_at: updatedAtIso,
  };

  writeTaskFile(a.filePath, nextA);
  writeTaskFile(b.filePath, nextB);
}

/**
 * Removes `dependsOnId` from `taskId.depends_on` and `taskId` from `dependsOnId.blocks` if present.
 */
export function removeDependency(
  tasksDir: string,
  taskId: string,
  dependsOnId: string,
  updatedAtIso: string,
): void {
  const a = findTaskFileById(tasksDir, taskId);
  const b = findTaskFileById(tasksDir, dependsOnId);
  if (a === null) {
    throw new Error(`No task with id "${taskId}"`);
  }
  if (b === null) {
    throw new Error(`No task with id "${dependsOnId}"`);
  }

  const nextA: Task = {
    ...a.task,
    depends_on: a.task.depends_on.filter((x) => x !== dependsOnId),
    updated_at: updatedAtIso,
  };
  const nextB: Task = {
    ...b.task,
    blocks: b.task.blocks.filter((x) => x !== taskId),
    updated_at: updatedAtIso,
  };

  writeTaskFile(a.filePath, nextA);
  writeTaskFile(b.filePath, nextB);
}

/** Graph edges as `{ from, to }` meaning `from` depends on `to`. */
export function listDependencyEdges(tasks: Task[]): Array<{ from: string; to: string }> {
  const edges: Array<{ from: string; to: string }> = [];
  for (const t of tasks) {
    for (const d of t.depends_on) {
      edges.push({ from: t.id, to: d });
    }
  }
  return edges;
}
