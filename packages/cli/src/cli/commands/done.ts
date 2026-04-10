import fs from "node:fs";

import { resolveGitHubToken } from "../../core/auth.js";
import type { TrailError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github-client.js";
import { taskToIssueUpdate } from "../../core/github-mapper.js";
import { compileSnapshot, writeSnapshot } from "../../core/compile-snapshot.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { findTaskFileById, loadAllTasks, writeTaskFile } from "../../core/task-store.js";
import { TrailConfigSchema } from "../../schemas/config.js";
import type { Task } from "../../schemas/task.js";

export type DoneOptions = {
  id: string;
  message: string;
};

function isLinkedTask(
  task: Task,
): task is Task & { github: NonNullable<Task["github"]> } {
  return task.github != null && typeof task.github === "object";
}

function conventionalPrefix(type: Task["type"]): string {
  switch (type) {
    case "bug":
      return "fix";
    case "chore":
      return "chore";
    case "epic":
    case "feature":
      return "feat";
    default:
      return "feat";
  }
}

export async function runDone(options: DoneOptions): Promise<void> {
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
  const config = TrailConfigSchema.parse(JSON.parse(raw));

  const resolved = findTaskFileById(paths.tasksDir, options.id);
  if (resolved === null) {
    throw new Error(`No task with id "${options.id}"`);
  }

  const now = new Date();
  const iso = now.toISOString();
  let next: Task = {
    ...resolved.task,
    status: "done",
    updated_at: iso,
  };

  writeTaskFile(resolved.filePath, next);

  const offline = config.sync.preset === "offline";
  const tokenResult = resolveGitHubToken();
  if (!offline && tokenResult.ok && isLinkedTask(next)) {
    const client = new GitHubClient(tokenResult.token);
    const { owner, repo } = config.github;
    const n = next.github.issue_number;
    await client.createIssueComment(owner, repo, n, options.message);
    await client.updateIssue(
      owner,
      repo,
      n,
      taskToIssueUpdate(next) as Record<string, unknown>,
    );
    const synced: Task = {
      ...next,
      github: {
        ...next.github,
        synced_at: now.toISOString(),
      },
    };
    writeTaskFile(resolved.filePath, synced);
    next = synced;
  }

  const tasks = loadAllTasks(paths.tasksDir);
  const snapshot = compileSnapshot(tasks, now);
  writeSnapshot(paths.snapshotPath, snapshot);

  if (isLinkedTask(next)) {
    const prefix = conventionalPrefix(next.type);
    const oneLine = options.message.replace(/\s+/g, " ").trim();
    console.log(
      `Suggested commit: ${prefix}: ${oneLine} (closes #${next.github.issue_number})`,
    );
  }
}
