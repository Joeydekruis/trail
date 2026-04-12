import fs from "node:fs";
import path from "node:path";

import type { GitHubClient } from "./github-client.js";
import { issueToTask, taskToIssueUpdate } from "./github-mapper.js";
import { compileSnapshot, writeSnapshot } from "./compile-snapshot.js";
import { computeRelevantTaskIds } from "./relevant-tasks.js";
import { loadAllTasks, readTaskFile, writeTaskFile } from "./task-store.js";
import type { Task } from "../schemas/task.js";

const ISSUES_PER_PAGE = 100;

export type SyncProgress =
  | { phase: "pull"; page: number; issuesInPage: number; issuesSoFar: number }
  | { phase: "push"; index: number; total: number; taskId: string };

export async function pullSync(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  tasksDir: string;
  now?: Date;
  onProgress?: (p: SyncProgress) => void;
}): Promise<void> {
  const { client, owner, repo, tasksDir } = options;
  const now = options.now ?? new Date();
  const onProgress = options.onProgress;
  let page = 1;
  let issuesSoFar = 0;

  for (;;) {
    const issues = await client.listIssues(owner, repo, {
      state: "all",
      per_page: ISSUES_PER_PAGE,
      page,
    });

    if (issues.length === 0) {
      break;
    }

    for (const issue of issues) {
      const filePath = path.join(tasksDir, `${issue.number}.json`);
      let existing: Task | null = null;
      if (fs.existsSync(filePath)) {
        existing = readTaskFile(filePath);
      }
      const task = issueToTask(issue, existing, now);
      writeTaskFile(filePath, task);
    }

    issuesSoFar += issues.length;
    onProgress?.({
      phase: "pull",
      page,
      issuesInPage: issues.length,
      issuesSoFar,
    });

    if (issues.length < ISSUES_PER_PAGE) {
      break;
    }
    page += 1;
  }
}

function isLinkedTask(
  task: Task,
): task is Task & { github: NonNullable<Task["github"]> } {
  return task.github != null && typeof task.github === "object";
}

export async function pushSync(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  tasks: Task[];
  /** When set, only issues for these task ids are pushed (bulk sync). Omit to push every linked task. */
  onlyTaskIds?: Set<string>;
  onProgress?: (p: SyncProgress) => void;
}): Promise<void> {
  const { client, owner, repo, tasks } = options;
  const only = options.onlyTaskIds;
  const onProgress = options.onProgress;

  const toPush = tasks.filter((task) => {
    if (task.status === "draft") {
      return false;
    }
    if (!isLinkedTask(task)) {
      return false;
    }
    if (only !== undefined && !only.has(task.id)) {
      return false;
    }
    return true;
  });

  let index = 0;
  for (const task of toPush) {
    if (!isLinkedTask(task)) {
      continue;
    }
    index += 1;
    onProgress?.({
      phase: "push",
      index,
      total: toPush.length,
      taskId: task.id,
    });
    const patch = taskToIssueUpdate(task);
    await client.updateIssue(owner, repo, task.github.issue_number, patch);
  }
}

export async function syncFull(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  tasksDir: string;
  snapshotPath: string;
  now?: Date;
  onProgress?: (p: SyncProgress) => void;
}): Promise<void> {
  const { client, owner, repo, tasksDir, snapshotPath, now } = options;
  await pullSync({ client, owner, repo, tasksDir, now, onProgress: options.onProgress });
  const tasks = loadAllTasks(tasksDir);
  const snapshot = compileSnapshot(tasks, now);
  writeSnapshot(snapshotPath, snapshot);
}

export async function fullSync(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  tasksDir: string;
  snapshotPath: string;
  now?: Date;
  onProgress?: (p: SyncProgress) => void;
}): Promise<void> {
  const { client, owner, repo, tasksDir, snapshotPath, now } = options;
  await pullSync({ client, owner, repo, tasksDir, now, onProgress: options.onProgress });
  const tasks = loadAllTasks(tasksDir);
  const relevant = computeRelevantTaskIds(tasks);
  await pushSync({
    client,
    owner,
    repo,
    tasks,
    onlyTaskIds: relevant,
    onProgress: options.onProgress,
  });
  const snapshot = compileSnapshot(tasks, now);
  writeSnapshot(snapshotPath, snapshot);
}
