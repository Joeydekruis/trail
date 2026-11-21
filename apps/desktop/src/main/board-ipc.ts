import { ipcMain } from "electron";
import { buildBoardSnapshot } from "@trail/core";
import {
  boardMoveIssuePayload,
  boardMoveIssueResult,
  boardSnapshotPayload,
  boardSnapshotResult,
  IpcChannels,
} from "@trail/ipc";
import { getIssueCacheStore, getIssueSyncConflictStore, getWorkspaceStore } from "./database";
import { moveBoardIssue } from "./board-move-issue";

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

    const conflictNumbers = new Set(
      getIssueSyncConflictStore()
        .listByWorkspace(id)
        .map((row) => row.issueNumber),
    );
    const snapshot = buildBoardSnapshot(issues, { conflictIssueNumbers: conflictNumbers });
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
    const result = await moveBoardIssue({
      workspaces,
      issues,
      workspaceId: id,
      issueNumber,
      targetColumn,
    });
    return boardMoveIssueResult.parse(result);
  });
}