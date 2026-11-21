import type { BoardColumnId } from "@trail/core";
import type { IssueCacheStore } from "@trail/core";
import type { WorkspaceStore } from "@trail/core";
import { setGitHubIssueState } from "./github-api";
import { updateIssueProjectStatus } from "./github-project-update";
import { readGitHubToken } from "./github-token-store";
import { readWorkspaceProjectStatusField } from "./workspace-github-settings";

export type MoveBoardIssueResult = { ok: true } | { ok: false; message: string };

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

export async function moveBoardIssue(input: {
  workspaces: WorkspaceStore;
  issues: IssueCacheStore;
  workspaceId: string;
  issueNumber: number;
  targetColumn: BoardColumnId;
}): Promise<MoveBoardIssueResult> {
  const { workspaces, issues, workspaceId, issueNumber, targetColumn } = input;
  const workspace = workspaces.list().find((row) => row.id === workspaceId);
  const repository = workspace?.repository;

  const cached = issues.get(workspaceId, issueNumber);
  if (!cached) {
    return { ok: false, message: "Issue not in cache — sync first" };
  }

  if (process.env.TRAIL_E2E === "1") {
    const updated = issues.updateBoardColumn(workspaceId, issueNumber, targetColumn);
    return updated
      ? { ok: true }
      : { ok: false, message: "Could not update issue column in cache" };
  }

  if (!repository) {
    return { ok: false, message: "Workspace is not linked to GitHub" };
  }

  const token = readGitHubToken();
  if (!token) {
    return { ok: false, message: "GitHub is not connected" };
  }

  const parts = parseRepository(repository);
  if (!parts) {
    return { ok: false, message: "Invalid repository on workspace" };
  }

  const statusField = readWorkspaceProjectStatusField(workspaces, workspaceId);
  const updated = await updateIssueProjectStatus(
    token,
    parts.owner,
    parts.repo,
    issueNumber,
    targetColumn,
    statusField,
  );
  if (!updated.ok) {
    return { ok: false, message: updated.message };
  }

  let nextState = cached.state;
  if (targetColumn === "done" && cached.state === "open") {
    const closed = await setGitHubIssueState(token, parts.owner, parts.repo, issueNumber, "closed");
    if (!closed.ok) {
      return { ok: false, message: closed.message };
    }
    nextState = "closed";
  } else if (targetColumn !== "done" && cached.state === "closed") {
    const reopened = await setGitHubIssueState(token, parts.owner, parts.repo, issueNumber, "open");
    if (!reopened.ok) {
      return { ok: false, message: reopened.message };
    }
    nextState = "open";
  }

  const saved = issues.updateBoardColumn(
    workspaceId,
    issueNumber,
    targetColumn,
    nextState,
  );
  if (!saved) {
    return { ok: false, message: "Could not update local cache" };
  }

  return { ok: true };
}