import type { TrailError } from "../../core/errors.js";
import { addDependency, removeDependency } from "../../core/deps.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { rebuildSnapshot } from "../../core/rebuild-snapshot.js";

export function runDepAdd(taskId: string, dependsOnId: string): void {
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
  const iso = new Date().toISOString();
  addDependency(paths.tasksDir, taskId, dependsOnId, iso);
  rebuildSnapshot(paths, new Date(iso));
  console.log(`Added dependency: ${taskId} depends on ${dependsOnId}`);
}

export function runDepRemove(taskId: string, dependsOnId: string): void {
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
  const iso = new Date().toISOString();
  removeDependency(paths.tasksDir, taskId, dependsOnId, iso);
  rebuildSnapshot(paths, new Date(iso));
  console.log(`Removed dependency: ${taskId} no longer depends on ${dependsOnId}`);
}
