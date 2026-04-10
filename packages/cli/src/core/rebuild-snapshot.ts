import { compileSnapshot, writeSnapshot } from "./compile-snapshot.js";
import { loadAllTasks } from "./task-store.js";
import type { TrailPaths } from "./paths.js";

/** Recompiles `.trail/snapshot.json` from all task files. */
export function rebuildSnapshot(paths: TrailPaths, now = new Date()): void {
  const tasks = loadAllTasks(paths.tasksDir);
  const snapshot = compileSnapshot(tasks, now);
  writeSnapshot(paths.snapshotPath, snapshot);
}
