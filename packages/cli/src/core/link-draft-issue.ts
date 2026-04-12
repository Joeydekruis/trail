import fs from "node:fs";
import path from "node:path";

import type { GitHubClient } from "./github-client.js";
import { issueToTask } from "./github-mapper.js";
import { writeTaskFile } from "./task-store.js";
import type { Task } from "../schemas/task.js";

/**
 * Creates a GitHub issue from a draft task, deletes the draft file, and writes
 * `{issueNumber}.json`. Mirrors `trail promote` without CLI validation.
 */
export async function linkDraftToNewGitHubIssue(options: {
  client: GitHubClient;
  owner: string;
  repo: string;
  draft: Task;
  draftFilePath: string;
  tasksDir: string;
  now: Date;
}): Promise<Task> {
  const { client, owner, repo, draft, draftFilePath, tasksDir, now } = options;

  const issue = await client.createIssue(owner, repo, {
    title: draft.title,
    body: draft.description ?? "",
    labels: draft.labels,
  });

  const promoted = issueToTask(issue, draft, now);
  fs.unlinkSync(draftFilePath);
  const newPath = path.join(tasksDir, `${issue.number}.json`);
  writeTaskFile(newPath, promoted);
  return promoted;
}
