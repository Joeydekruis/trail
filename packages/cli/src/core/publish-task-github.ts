import path from "node:path";

import type { GitHubClient } from "./github-client.js";
import { linkDraftToNewGitHubIssue } from "./link-draft-issue.js";
import {
  isLinkedTask,
  pushLinkedTaskToGitHub,
  shouldPublishTaskToGitHub,
} from "./push-linked-task.js";
import type { TrailPaths } from "./paths.js";
import type { TrailConfig } from "../schemas/config.js";
import type { Task } from "../schemas/task.js";

export type PublishTaskResult =
  | { ok: true; task: Task; filePath: string }
  | { ok: false; task: Task; filePath: string; warning: string };

/**
 * Creates or updates a GitHub issue when the task is Todo+ (not Draft).
 * Draft tasks are returned unchanged.
 */
export async function publishTaskToGitHub(options: {
  config: TrailConfig;
  paths: TrailPaths;
  task: Task;
  filePath: string;
  client: GitHubClient;
  now?: Date;
}): Promise<PublishTaskResult> {
  const { config, paths, task, filePath, client } = options;
  const now = options.now ?? new Date();

  if (!shouldPublishTaskToGitHub(config.sync.preset, task.status)) {
    return { ok: true, task, filePath };
  }

  const { owner, repo } = config.github;

  try {
    if (isLinkedTask(task)) {
      const synced = await pushLinkedTaskToGitHub({
        client,
        owner,
        repo,
        task,
        filePath,
        now,
      });
      return { ok: true, task: synced, filePath };
    }

    const promoted = await linkDraftToNewGitHubIssue({
      client,
      owner,
      repo,
      draft: task,
      draftFilePath: filePath,
      tasksDir: paths.tasksDir,
      now,
    });
    const newPath = path.join(
      paths.tasksDir,
      `${promoted.github!.issue_number}.json`,
    );
    return { ok: true, task: promoted, filePath: newPath };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to sync with GitHub";
    return {
      ok: false,
      task,
      filePath,
      warning: `Saved locally only: ${message}`,
    };
  }
}
