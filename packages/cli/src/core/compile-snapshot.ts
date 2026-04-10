import fs from "node:fs";
import path from "node:path";

import type { Task } from "../schemas/task.js";
import { SnapshotSchema, type Snapshot } from "../schemas/snapshot.js";

const UNKNOWN_DEPENDENCY = "UNKNOWN_DEPENDENCY";
const DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE";

/**
 * Finds directed cycles in the dependency graph: edge `u → v` when task `u` lists `v` in `depends_on`.
 * Only vertices in `taskIds` participate; edges to ids outside `taskIds` are ignored here (handled as warnings in `compileSnapshot`).
 */
export function detectCycles(
  taskIds: Set<string>,
  deps: Map<string, string[]>,
): string[][] {
  const cycles: string[][] = [];
  /** Finished nodes (BLACK). */
  const visited = new Set<string>();
  /** Nodes on the current DFS path (GRAY). */
  const visiting = new Set<string>();
  const stack: string[] = [];

  function recordCycle(fromIndex: number): void {
    cycles.push(stack.slice(fromIndex));
  }

  function dfs(u: string): void {
    visiting.add(u);
    stack.push(u);

    for (const v of deps.get(u) ?? []) {
      if (!taskIds.has(v)) {
        continue;
      }
      if (visiting.has(v)) {
        const i = stack.indexOf(v);
        if (i !== -1) {
          recordCycle(i);
        }
        continue;
      }
      if (!visited.has(v)) {
        dfs(v);
      }
    }

    stack.pop();
    visiting.delete(u);
    visited.add(u);
  }

  for (const id of taskIds) {
    if (!visited.has(id)) {
      dfs(id);
    }
  }

  return cycles;
}

function formatCycle(nodes: string[]): string {
  return nodes.join(" → ");
}

/**
 * Builds a snapshot from tasks, with warnings for unknown dependency ids and dependency cycles.
 */
export function compileSnapshot(tasks: Task[], now?: Date): Snapshot {
  const generatedAt = (now ?? new Date()).toISOString();
  const taskList = [...tasks];
  const taskIds = new Set(taskList.map((t) => t.id));
  const deps = new Map<string, string[]>();
  for (const t of taskList) {
    deps.set(t.id, t.depends_on ?? []);
  }

  const warnings: Snapshot["warnings"] = [];

  for (const t of taskList) {
    for (const depId of t.depends_on ?? []) {
      if (!taskIds.has(depId)) {
        warnings.push({
          code: UNKNOWN_DEPENDENCY,
          message: `Task "${t.id}" depends on unknown task id "${depId}"`,
          taskId: t.id,
        });
      }
    }
  }

  for (const cycle of detectCycles(taskIds, deps)) {
    warnings.push({
      code: DEPENDENCY_CYCLE,
      message: `Dependency cycle: ${formatCycle(cycle)}`,
      taskId: cycle[0],
    });
  }

  return {
    generated_at: generatedAt,
    tasks: taskList,
    warnings,
  };
}

export function writeSnapshot(snapshotPath: string, snapshot: Snapshot): void {
  const parsed = SnapshotSchema.parse(snapshot);
  const dir = path.dirname(snapshotPath);
  fs.mkdirSync(dir, { recursive: true });
  const body = `${JSON.stringify(parsed, null, 2)}\n`;
  fs.writeFileSync(snapshotPath, body, "utf8");
}
