import fs from "node:fs";
import path from "node:path";

import type { GitHubClient } from "./github-client.js";
import { issueToTask, taskToIssueUpdate } from "./github-mapper.js";
import { compileSnapshot, writeSnapshot } from "./compile-snapshot.js";
import { loadAllTasks, readTaskFile, writeTaskFile } from "./task-store.js";
import type { Task } from "../schemas/task.js";

const ISSUES_PER_PAGE = 100;

export async function pullSync(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  tasksDir: string;
  now?: Date;
}): Promise<void> {
  const { client, owner, repo, tasksDir } = options;
  const now = options.now ?? new Date();
  let page = 1;

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
}): Promise<void> {
  const { client, owner, repo, tasks } = options;

  for (const task of tasks) {
    if (task.status === "draft") {
      continue;
    }
    if (!isLinkedTask(task)) {
      continue;
    }
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
}): Promise<void> {
  const { client, owner, repo, tasksDir, snapshotPath, now } = options;
  await pullSync({ client, owner, repo, tasksDir, now });
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
}): Promise<void> {
  const { client, owner, repo, tasksDir, snapshotPath, now } = options;
  await pullSync({ client, owner, repo, tasksDir, now });
  const tasks = loadAllTasks(tasksDir);
  await pushSync({ client, owner, repo, tasks });
  const snapshot = compileSnapshot(tasks, now);
  writeSnapshot(snapshotPath, snapshot);
}
