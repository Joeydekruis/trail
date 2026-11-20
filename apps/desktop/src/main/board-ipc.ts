import { ipcMain } from "electron";
import { buildBoardSnapshot } from "@trail/core";
import { boardSnapshotPayload, boardSnapshotResult, IpcChannels } from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore } from "./database";

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
}