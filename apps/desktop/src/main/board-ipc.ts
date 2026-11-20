import { ipcMain } from "electron";
import { buildBoardSnapshot, type BoardColumnId } from "@trail/core";
import {
  boardMoveIssuePayload,
  boardMoveIssueResult,
  boardSnapshotPayload,
  boardSnapshotResult,
  IpcChannels,
} from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore } from "./database";
import { setGitHubIssueState } from "./github-api";
import { updateIssueProjectStatus } from "./github-project-update";
import { readGitHubToken } from "./github-token-store";
import { readWorkspaceProjectStatusField } from "./workspace-github-settings";

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

export function registerBoardIpc(): void {
  ipcMain.handle(IpcChannels.boardSnapshot, (_event, raw: unknown) => {
    const { workspaceId } = boardSnapshotPayload.parse(raw ?? {});
    const workspaces = getWorkspaceStore();
    const id = workspaceId ?? workspaces.getActiveId();
    const workspace = workspaces.list().find((row) => row.id === id);
    const issues = getIssueCacheStore().listByWorkspace(id);

    if (!workspace?.repository) {
      return boardSnapshotResult.parse({
        source: "fixture",
        repository: null,
        openCount: 0,
        columns: [],
      });
    }

    const snapshot = buildBoardSnapshot(issues);
    return boardSnapshotResult.parse({
      source: "cache",
      repository: workspace.repository,
      openCount: snapshot.openCount,
      columns: snapshot.columns,
    });
  });

  ipcMain.handle(IpcChannels.boardMoveIssue, async (_event, raw: unknown) => {
    const { workspaceId, issueNumber, targetColumn } = boardMoveIssuePayload.parse(raw);
    const workspaces = getWorkspaceStore();
    const issues = getIssueCacheStore();
    const id = workspaceId ?? workspaces.getActiveId();
    const workspace = workspaces.list().find((row) => row.id === id);
    const repository = workspace?.repository;

    if (!repository) {
      return boardMoveIssueResult.parse({ ok: false, message: "Workspace is not linked to GitHub" });
    }

    const cached = issues.get(id, issueNumber);
    if (!cached) {
      return boardMoveIssueResult.parse({ ok: false, message: "Issue not in cache — sync first" });
    }

    const token = readGitHubToken();
    if (!token) {
      return boardMoveIssueResult.parse({ ok: false, message: "GitHub is not connected" });
    }

    const parts = parseRepository(repository);
    if (!parts) {
      return boardMoveIssueResult.parse({ ok: false, message: "Invalid repository on workspace" });
    }

    const statusField = readWorkspaceProjectStatusField(workspaces, id);
    const updated = await updateIssueProjectStatus(
      token,
      parts.owner,
      parts.repo,
      issueNumber,
      targetColumn as BoardColumnId,
      statusField,
    );
    if (!updated.ok) {
      return boardMoveIssueResult.parse({ ok: false, message: updated.message });
    }

    let nextState = cached.state;
    if (targetColumn === "done" && cached.state === "open") {
      const closed = await setGitHubIssueState(token, parts.owner, parts.repo, issueNumber, "closed");
      if (!closed.ok) {
        return boardMoveIssueResult.parse({ ok: false, message: closed.message });
      }
      nextState = "closed";
    } else if (targetColumn !== "done" && cached.state === "closed") {
      const reopened = await setGitHubIssueState(token, parts.owner, parts.repo, issueNumber, "open");
      if (!reopened.ok) {
        return boardMoveIssueResult.parse({ ok: false, message: reopened.message });
      }
      nextState = "open";
    }

    const saved = issues.updateBoardColumn(
      id,
      issueNumber,
      targetColumn as BoardColumnId,
      nextState,
    );
    if (!saved) {
      return boardMoveIssueResult.parse({ ok: false, message: "Could not update local cache" });
    }

    return boardMoveIssueResult.parse({ ok: true });
  });
}