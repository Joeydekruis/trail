import fs from "node:fs";
import path from "node:path";

import { resolveGitHubToken } from "../../core/auth.js";
import type { TrailError } from "../../core/errors.js";
import { GitHubClient } from "../../core/github-client.js";
import { issueToTask } from "../../core/github-mapper.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { rebuildSnapshot } from "../../core/rebuild-snapshot.js";
import { findTaskFileById, writeTaskFile } from "../../core/task-store.js";
import { TrailConfigSchema } from "../../schemas/config.js";
export async function runPromote(options: { id: string }): Promise<void> {
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

  if (config.sync.preset === "offline") {
    throw new Error("Cannot promote a draft in offline mode (no GitHub access).");
  }

  const tokenResult = resolveGitHubToken();
  if (!tokenResult.ok) {
    throw tokenResult.error;
  }

  const resolved = findTaskFileById(paths.tasksDir, options.id);
  if (resolved === null) {
    throw new Error(`No task with id "${options.id}"`);
  }

  const draft = resolved.task;
  if (draft.status !== "draft") {
    throw new Error(`Task "${options.id}" is not a draft (status is ${draft.status}).`);
  }
  if (draft.github != null) {
    throw new Error(`Task "${options.id}" is already linked to GitHub.`);
  }

  const now = new Date();
  const client = new GitHubClient(tokenResult.token);
  const { owner, repo } = config.github;

  const issue = await client.createIssue(owner, repo, {
    title: draft.title,
    body: draft.description || "",
    labels: draft.labels,
  });

  const promoted = issueToTask(issue, draft, now);
  fs.unlinkSync(resolved.filePath);
  const newPath = path.join(paths.tasksDir, `${issue.number}.json`);
  writeTaskFile(newPath, promoted);
  rebuildSnapshot(paths, now);

  console.log(`Promoted ${draft.id} → GitHub issue #${issue.number}`);
  console.log(`  File: ${newPath}`);
  console.log(`  URL: ${issue.html_url}`);
}
