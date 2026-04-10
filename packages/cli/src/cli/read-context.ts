import fs from "node:fs";

import type { TrailError } from "../core/errors.js";
import { maybePullBeforeRead } from "../core/maybe-pull.js";
import { findTrailRoot, trailPaths, type TrailPaths } from "../core/paths.js";
import { loadAllTasks } from "../core/task-store.js";
import { TrailConfigSchema, type TrailConfig } from "../schemas/config.js";
import type { Task } from "../schemas/task.js";

export type TrailReadContext = {
  root: string;
  paths: TrailPaths;
  config: TrailConfig;
  tasks: Task[];
};

export async function loadTrailReadContext(cwd: string): Promise<TrailReadContext> {
  const root = findTrailRoot(cwd);
  if (root === null) {
    const err: TrailError = {
      code: "NOT_A_TRAIL_REPO",
      message:
        "Not a Trail repository (missing .trail/config.json). Run `trail init` first.",
      path: cwd,
    };
    throw err;
  }

  const paths = trailPaths(root);
  const raw = fs.readFileSync(paths.configPath, "utf-8");
  const config = TrailConfigSchema.parse(JSON.parse(raw));
  await maybePullBeforeRead(config, paths);
  const tasks = loadAllTasks(paths.tasksDir);
  return { root, paths, config, tasks };
}
