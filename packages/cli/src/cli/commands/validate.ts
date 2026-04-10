import fs from "node:fs";

import type { TrailError } from "../../core/errors.js";
import { compileSnapshot, DEPENDENCY_CYCLE } from "../../core/compile-snapshot.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { loadAllTasks } from "../../core/task-store.js";
import { TrailConfigSchema } from "../../schemas/config.js";

/**
 * Loads tasks, compiles snapshot, prints warnings. Returns exit code: 1 if any
 * `DEPENDENCY_CYCLE` warning, else 0.
 */
export async function runValidate(): Promise<number> {
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
  const raw = fs.readFileSync(paths.configPath, "utf-8");
  TrailConfigSchema.parse(JSON.parse(raw));

  const tasks = loadAllTasks(paths.tasksDir);
  const snapshot = compileSnapshot(tasks);
  for (const w of snapshot.warnings) {
    console.log(`${w.code}: ${w.message}`);
  }
  const hasCycle = snapshot.warnings.some((w) => w.code === DEPENDENCY_CYCLE);
  return hasCycle ? 1 : 0;
}
