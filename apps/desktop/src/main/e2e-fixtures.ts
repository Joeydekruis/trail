import { join } from "node:path";
import type { SqliteDatabase } from "@trail/core";
import type { IssueCacheStore, WorktreeStore } from "@trail/core";
import { worktreeId } from "@trail/core";

const E2E_WORKSPACE_ID = "trail";
const E2E_REPOSITORY = "trail/demo";

export function shouldApplyE2eFixtures(): boolean {
  return process.env.TRAIL_E2E === "1";
}

export function seedE2eFixtures(
  db: SqliteDatabase,
  issues: IssueCacheStore,
  worktrees: WorktreeStore,
): void {
  if (!shouldApplyE2eFixtures()) {
    return;
  }

  db.prepare("UPDATE workspaces SET repository = ? WHERE id = ?").run(
    E2E_REPOSITORY,
    E2E_WORKSPACE_ID,
  );

  const now = new Date().toISOString();
  issues.replaceWorkspaceIssues(E2E_WORKSPACE_ID, [
    {
      workspaceId: E2E_WORKSPACE_ID,
      number: 42,
      title: "E2E board drag",
      state: "open",
      boardColumn: "todo",
      priority: "medium",
      labels: ["agent-ready"],
      updatedAt: now,
      htmlUrl: "https://github.com/trail/demo/issues/42",
      body: "Seeded for Playwright",
      assigneeLogin: null,
    },
    {
      workspaceId: E2E_WORKSPACE_ID,
      number: 43,
      title: "E2E agent run",
      state: "open",
      boardColumn: "in-progress",
      priority: "high",
      labels: [],
      updatedAt: now,
      htmlUrl: "https://github.com/trail/demo/issues/43",
      body: null,
      assigneeLogin: null,
    },
  ]);

  const repoRoot = join(process.cwd(), "..", "..");
  worktrees.upsert({
    id: worktreeId(E2E_WORKSPACE_ID, 43),
    workspaceId: E2E_WORKSPACE_ID,
    issueNumber: 43,
    title: "E2E agent run",
    branch: "feat/43-e2e",
    path: repoRoot,
    status: "stopped",
    isRemote: false,
    createdAt: now,
    pullRequestUrl: null,
  });
}