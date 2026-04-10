import fs from "node:fs";

import { resolveGitHubToken } from "../../core/auth.js";
import type { TrailError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github-client.js";
import { taskToIssueUpdate } from "../../core/github-mapper.js";
import { rebuildSnapshot } from "../../core/rebuild-snapshot.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { findTaskFileById, writeTaskFile } from "../../core/task-store.js";
import { TrailConfigSchema } from "../../schemas/config.js";
import type { Task, TaskStatus } from "../../schemas/task.js";

const STATUSES: TaskStatus[] = [
  "draft",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
];

export type UpdateOptions = {
  id: string;
  status?: TaskStatus;
  priority?: "p0" | "p1" | "p2" | "p3";
  title?: string;
};

function isLinkedTask(
  task: Task,
): task is Task & { github: NonNullable<Task["github"]> } {
  return task.github != null && typeof task.github === "object";
}

export async function runUpdate(options: UpdateOptions): Promise<void> {
  const hasField =
    options.status !== undefined ||
    options.priority !== undefined ||
    options.title !== undefined;
  if (!hasField) {
    throw new Error("Specify at least one of --status, --priority, or --title");
  }

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
    updated_at: iso,
  };
  if (options.status !== undefined) {
    next = { ...next, status: options.status };
  }
  if (options.priority !== undefined) {
    next = { ...next, priority: options.priority };
  }
  if (options.title !== undefined) {
    next = { ...next, title: options.title };
  }

  writeTaskFile(resolved.filePath, next);

  const offline = config.sync.preset === "offline";
  const tokenResult = resolveGitHubToken();
  if (!offline && tokenResult.ok && isLinkedTask(next)) {
    const client = new GitHubClient(tokenResult.token);
    const { owner, repo } = config.github;
    await client.updateIssue(
      owner,
      repo,
      next.github.issue_number,
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
  }

  rebuildSnapshot(paths, now);
}

export { STATUSES as UPDATE_STATUS_CHOICES };
