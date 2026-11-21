import type { BoardColumnId, IssueCacheStore, IssueSyncConflictStore, WorkspaceStore } from "@trail/core";
import { applySyncConflictPicks, type SyncConflictResolutionPicks } from "@trail/core";
import { moveBoardIssue } from "./board-move-issue";
import { setGitHubIssueLabels, setGitHubIssueState } from "./github-api";
import { readGitHubToken } from "./github-token-store";

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

export async function resolveIssueSyncConflict(input: {
  workspaces: WorkspaceStore;
  issues: IssueCacheStore;
  conflicts: IssueSyncConflictStore;
  workspaceId: string;
  issueNumber: number;
  useGitHubForAll?: boolean;
  picks?: SyncConflictResolutionPicks;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { workspaces, issues, conflicts, workspaceId, issueNumber } = input;
  const conflict = conflicts.get(workspaceId, issueNumber);
  if (!conflict) {
    return { ok: false, message: "Sync conflict not found" };
  }

  const resolved = applySyncConflictPicks(
    conflict,
    input.picks ?? {},
    input.useGitHubForAll === true,
  );

  const workspace = workspaces.list().find((row) => row.id === workspaceId);
  const repository = workspace?.repository;
  if (!repository) {
    return { ok: false, message: "Workspace is not linked to GitHub" };
  }

  if (process.env.TRAIL_E2E === "1") {
    const cached = issues.get(workspaceId, issueNumber);
    if (!cached) {
      return { ok: false, message: "Issue not in cache" };
    }
    issues.upsert({
      ...cached,
      state: resolved.state,
      boardColumn: resolved.boardColumn,
      labels: resolved.labels,
      updatedAt: new Date().toISOString(),
    });
    conflicts.deleteConflict(workspaceId, issueNumber);
    return { ok: true };
  }

  const token = readGitHubToken();
  if (!token) {
    return { ok: false, message: "GitHub is not connected" };
  }

  const parts = parseRepository(repository);
  if (!parts) {
    return { ok: false, message: "Invalid repository on workspace" };
  }

  const cached = issues.get(workspaceId, issueNumber);
  if (!cached) {
    return { ok: false, message: "Issue not in cache" };
  }

  if (resolved.state !== cached.state) {
    if (resolved.state !== "open" && resolved.state !== "closed") {
      return { ok: false, message: `Unsupported issue state: ${resolved.state}` };
    }
    const stateResult = await setGitHubIssueState(
      token,
      parts.owner,
      parts.repo,
      issueNumber,
      resolved.state,
    );
    if (!stateResult.ok) {
      return stateResult;
    }
  }

  if (resolved.boardColumn !== cached.boardColumn) {
    const move = await moveBoardIssue({
      workspaces,
      issues,
      workspaceId,
      issueNumber,
      targetColumn: resolved.boardColumn as BoardColumnId,
    });
    if (!move.ok) {
      return move;
    }
  } else if (resolved.state !== cached.state) {
    issues.upsert({
      ...cached,
      state: resolved.state,
      updatedAt: new Date().toISOString(),
    });
  }

  const labelsKey = [...cached.labels].sort().join(",");
  const resolvedLabelsKey = [...resolved.labels].sort().join(",");
  if (labelsKey !== resolvedLabelsKey) {
    const labelResult = await setGitHubIssueLabels(
      token,
      parts.owner,
      parts.repo,
      issueNumber,
      resolved.labels,
    );
    if (!labelResult.ok) {
      return labelResult;
    }
    const fresh = issues.get(workspaceId, issueNumber);
    if (fresh) {
      issues.upsert({
        ...fresh,
        labels: resolved.labels,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const afterBoard = issues.get(workspaceId, issueNumber);
  if (afterBoard) {
    issues.upsert({
      ...afterBoard,
      state: resolved.state,
      boardColumn: resolved.boardColumn,
      labels: resolved.labels,
      updatedAt: new Date().toISOString(),
    });
  }

  conflicts.deleteConflict(workspaceId, issueNumber);
  return { ok: true };
}