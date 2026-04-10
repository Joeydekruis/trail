import fs from "node:fs";

import { resolveGitHubToken } from "../../core/auth.js";
import { type TrailError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github-client.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { loadAllTasks } from "../../core/task-store.js";
import { fullSync, pullSync, pushSync } from "../../core/sync.js";
import { TrailConfigSchema } from "../../schemas/config.js";

export type SyncOptions = {
  pull?: boolean;
  push?: boolean;
};

export async function runSync(options: SyncOptions): Promise<void> {
  const root = findTrailRoot(process.cwd());
  if (root === null) {
    const err: TrailError = {
      code: "NOT_A_TRAIL_REPO",
      message: "Not a Trail repository (missing .trail/config.json). Run `trail init` first.",
      path: process.cwd(),
    };
    throw err;
  }

  const paths = trailPaths(root);
  const raw = fs.readFileSync(paths.configPath, "utf-8");
  const config = TrailConfigSchema.parse(JSON.parse(raw));

  if (config.sync.preset === "offline") {
    throw new Error("Cannot sync in offline mode");
  }

  const tokenResult = resolveGitHubToken();
  if (!tokenResult.ok) {
    throw tokenResult.error;
  }

  const client = new GitHubClient(tokenResult.token);
  const { owner, repo } = config.github;
  const { tasksDir, snapshotPath } = paths;

  const pullOnly = options.pull === true && options.push !== true;
  const pushOnly = options.push === true && options.pull !== true;

  if (pullOnly) {
    await pullSync({ client, owner, repo, tasksDir });
    return;
  }

  if (pushOnly) {
    const tasks = loadAllTasks(tasksDir);
    await pushSync({ client, owner, repo, tasks });
    return;
  }

  await fullSync({ client, owner, repo, tasksDir, snapshotPath });
}
