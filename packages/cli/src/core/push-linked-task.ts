import type { GitHubClient } from "./github-client.js";
import { taskToIssueUpdate } from "./github-mapper.js";
import { writeTaskFile } from "./task-store.js";
import { TaskSchema, type Task, type TaskStatus } from "../schemas/task.js";
import type { TrailConfig } from "../schemas/config.js";

export function isLinkedTask(
  task: Task,
): task is Task & { github: NonNullable<Task["github"]> } {
  return task.github != null && typeof task.github === "object";
}

/** True when the preset allows reading/writing GitHub (solo and collaborative). */
export function canSyncWithGitHub(
  preset: TrailConfig["sync"]["preset"],
): boolean {
  return preset !== "offline";
}

/** Board columns from Todo onward sync to GitHub; Draft stays local until promoted. */
export function isPublishableStatus(status: TaskStatus): boolean {
  return status !== "draft";
}

/** Push or create a GitHub issue when the task is Todo+ and sync is enabled. */
export function shouldPublishTaskToGitHub(
  preset: TrailConfig["sync"]["preset"],
  status: TaskStatus,
): boolean {
  return canSyncWithGitHub(preset) && isPublishableStatus(status);
}

/**
 * Pushes a linked task to GitHub and updates `github.synced_at` in the local file.
 */
export async function pushLinkedTaskToGitHub(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  task: Task & { github: NonNullable<Task["github"]> };
  filePath: string;
  now?: Date;
}): Promise<Task> {
  const { client, owner, repo, task, filePath } = options;
  const now = options.now ?? new Date();

  await client.updateIssue(
    owner,
    repo,
    task.github.issue_number,
    taskToIssueUpdate(task) as Record<string, unknown>,
  );

  const synced: Task = {
    ...task,
    github: {
      ...task.github,
      synced_at: now.toISOString(),
    },
  };
  const parsed = TaskSchema.parse(synced);
  writeTaskFile(filePath, parsed);
  return parsed;
}
