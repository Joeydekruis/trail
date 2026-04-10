import type { TrailError } from "../../core/errors.js";
import { listDependencyEdges } from "../../core/deps.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { loadAllTasks } from "../../core/task-store.js";
import { printJson } from "../json.js";

export function runGraph(options: { json?: boolean }): void {
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
  const tasks = loadAllTasks(paths.tasksDir);
  const edges = listDependencyEdges(tasks);

  if (options.json) {
    printJson(edges);
    return;
  }

  if (edges.length === 0) {
    console.log("No dependencies.");
    return;
  }

  for (const e of edges) {
    console.log(`${e.from}  →  depends on  →  ${e.to}`);
  }
}
