import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  branchNameForIssue,
  worktreeDirectoryName,
  worktreeId,
  type IssueCacheStore,
  type WorktreeRecord,
  type WorktreeStore,
  type WorkspaceStore,
} from "@trail/core";
import { isGitRepository, runGit } from "./git-exec";
import { readWorkspaceRepoRoot, readWorkspaceWorktreeRoot } from "./worktree-paths";

export type CreateWorktreeOutcome =
  | { ok: true; record: WorktreeRecord }
  | { ok: false; message: string };

export function createLocalWorktree(input: {
  workspaceStore: WorkspaceStore;
  worktreeStore: WorktreeStore;
  issueStore: IssueCacheStore;
  workspaceId: string;
  issueNumber: number;
  title?: string;
}): CreateWorktreeOutcome {
  const workspace = input.workspaceStore
    .list()
    .find((ws) => ws.id === input.workspaceId);
  if (!workspace) {
    return { ok: false, message: "Workspace not found" };
  }

  const repoRoot = readWorkspaceRepoRoot(input.workspaceStore, input.workspaceId);
  if (!repoRoot) {
    return {
      ok: false,
      message: "Set a local repository folder in Settings before creating worktrees",
    };
  }
  if (!isGitRepository(repoRoot)) {
    return { ok: false, message: "Local repository folder is not a git checkout" };
  }

  const cached = input.issueStore.get(input.workspaceId, input.issueNumber);
  const title =
    input.title?.trim() ||
    cached?.title ||
    `Issue #${input.issueNumber}`;

  const existing = input.worktreeStore.get(input.workspaceId, input.issueNumber);
  if (existing) {
    return { ok: true, record: existing };
  }

  const branch = branchNameForIssue(input.issueNumber, title);
  const worktreeRoot = readWorkspaceWorktreeRoot(
    input.workspaceStore,
    input.workspaceId,
  );
  mkdirSync(worktreeRoot, { recursive: true });
  const worktreePath = join(worktreeRoot, worktreeDirectoryName(input.issueNumber));

  const branchExists = runGit(repoRoot, [
    "show-ref",
    "--verify",
    "--quiet",
    `refs/heads/${branch}`,
  ]);
  const startPoint = workspace.integrationBranch;
  const addArgs =
    branchExists.ok
      ? ["worktree", "add", worktreePath, branch]
      : ["worktree", "add", "-b", branch, worktreePath, startPoint];

  const added = runGit(repoRoot, addArgs);
  if (!added.ok) {
    return { ok: false, message: added.message };
  }

  const createdAt = new Date().toISOString();
  const record: WorktreeRecord = {
    id: worktreeId(input.workspaceId, input.issueNumber),
    workspaceId: input.workspaceId,
    issueNumber: input.issueNumber,
    title,
    branch,
    path: worktreePath,
    status: "queued",
    isRemote: false,
    createdAt,
  };
  input.worktreeStore.upsert(record);
  return { ok: true, record };
}