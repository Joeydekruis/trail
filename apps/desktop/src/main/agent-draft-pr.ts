import type { IssueCacheStore, WorkspaceStore, WorktreeRecord, WorktreeStore } from "@trail/core";
import { draftPullRequestBody, draftPullRequestTitle } from "@trail/core";
import {
  getIssueCacheStore,
  getWorktreeStore,
  getWorkspaceStore,
} from "./database";
import { createDraftPullRequest } from "./github-api";
import { readGitHubToken } from "./github-token-store";
import { runGit } from "./git-exec";
import { moveBoardIssue } from "./board-move-issue";
import { runAutopilotTick } from "./autopilot-service";

function parseRepository(fullName: string): { owner: string; repo: string } | null {
  const slash = fullName.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return {
    owner: fullName.slice(0, slash),
    repo: fullName.slice(slash + 1),
  };
}

function commitOutstandingChanges(worktreePath: string, issueNumber: number): GitRunOutcome {
  const status = runGit(worktreePath, ["status", "--porcelain"]);
  if (!status.ok) {
    return { ok: false, message: status.message };
  }
  if (!status.stdout.trim()) {
    return { ok: true };
  }
  const add = runGit(worktreePath, ["add", "-A"]);
  if (!add.ok) {
    return { ok: false, message: add.message };
  }
  const commit = runGit(worktreePath, [
    "commit",
    "-m",
    `trail: agent work for #${issueNumber}`,
  ]);
  if (!commit.ok) {
    return { ok: false, message: commit.message };
  }
  return { ok: true };
}

type GitRunOutcome = { ok: true } | { ok: false; message: string };

function hasCommitsAhead(worktreePath: string, baseBranch: string): boolean {
  const count = runGit(worktreePath, ["rev-list", "--count", `${baseBranch}..HEAD`]);
  if (!count.ok) {
    return false;
  }
  const n = Number.parseInt(count.stdout, 10);
  return Number.isFinite(n) && n > 0;
}

type AgentFinalizeDeps = {
  workspaces: WorkspaceStore;
  issues: IssueCacheStore;
  worktrees: WorktreeStore;
};

function defaultDeps(): AgentFinalizeDeps {
  return {
    workspaces: getWorkspaceStore(),
    issues: getIssueCacheStore(),
    worktrees: getWorktreeStore(),
  };
}

function markWorktree(
  worktreeStore: WorktreeStore,
  record: WorktreeRecord,
  status: WorktreeRecord["status"],
  isRemote: boolean,
): void {
  worktreeStore.upsert({
    ...record,
    status,
    isRemote,
  });
}

/** After agent utility exits: commit, push, open draft PR, move board to In review. */
export async function finalizeAgentRun(
  workspaceId: string,
  issueNumber: number,
  exitCode: number,
  deps: AgentFinalizeDeps = defaultDeps(),
  options: { triggerAutopilot?: boolean } = {},
): Promise<void> {
  const triggerAutopilot = options.triggerAutopilot ?? true;
  const worktreeStore = deps.worktrees;
  const record = worktreeStore.get(workspaceId, issueNumber);
  if (!record) {
    return;
  }

  if (exitCode !== 0) {
    markWorktree(worktreeStore, record, "failed", false);
    return;
  }

  if (process.env.TRAIL_E2E === "1") {
    markWorktree(worktreeStore, record, "review", true);
    await moveBoardIssue({
      workspaces: deps.workspaces,
      issues: deps.issues,
      workspaceId,
      issueNumber,
      targetColumn: "in-review",
    });
    if (triggerAutopilot) {
      void runAutopilotTick(workspaceId);
    }
    return;
  }

  const workspace = deps.workspaces.list().find((row) => row.id === workspaceId);
  const repository = workspace?.repository;
  const token = readGitHubToken();
  const baseBranch = workspace?.integrationBranch ?? "development";

  if (!repository || !token) {
    markWorktree(worktreeStore, record, "failed", false);
    console.warn("[trail] draft PR: missing repository or GitHub token");
    return;
  }

  const commit = commitOutstandingChanges(record.path, issueNumber);
  if (!commit.ok) {
    markWorktree(worktreeStore, record, "failed", false);
    console.warn("[trail] draft PR commit:", commit.message);
    return;
  }

  if (!hasCommitsAhead(record.path, baseBranch)) {
    markWorktree(worktreeStore, record, "failed", false);
    console.warn("[trail] draft PR: no commits to publish");
    return;
  }

  const push = runGit(record.path, ["push", "-u", "origin", record.branch]);
  if (!push.ok) {
    markWorktree(worktreeStore, record, "failed", false);
    console.warn("[trail] draft PR push:", push.message);
    return;
  }

  const parts = parseRepository(repository);
  if (!parts) {
    markWorktree(worktreeStore, record, "failed", false);
    return;
  }

  const issue = deps.issues.get(workspaceId, issueNumber);
  const pr = await createDraftPullRequest(token, parts.owner, parts.repo, {
    title: draftPullRequestTitle(issueNumber, issue?.title ?? record.title),
    head: record.branch,
    base: baseBranch,
    body: draftPullRequestBody(issueNumber, issue?.htmlUrl ?? null),
  });

  if (!pr.ok) {
    markWorktree(worktreeStore, record, "failed", false);
    console.warn("[trail] draft PR create:", pr.message);
    return;
  }

  markWorktree(worktreeStore, record, "review", true);
  const moved = await moveBoardIssue({
    workspaces: deps.workspaces,
    issues: deps.issues,
    workspaceId,
    issueNumber,
    targetColumn: "in-review",
  });
  if (!moved.ok) {
    console.warn("[trail] draft PR board move:", moved.message);
  }

  console.info("[trail] draft PR opened:", pr.htmlUrl);
  if (triggerAutopilot) {
    void runAutopilotTick(workspaceId);
  }
}