import { ipcMain } from "electron";
import { issueRecordToDetail } from "@trail/core";
import { IpcChannels, issueGetPayload, issueGetResult } from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore } from "./database";

export function registerIssueIpc(): void {
  ipcMain.handle(IpcChannels.issueGet, (_event, raw: unknown) => {
    const { workspaceId, issueNumber } = issueGetPayload.parse(raw);
    const workspaces = getWorkspaceStore();
    const id = workspaceId ?? workspaces.getActiveId();
    const record = getIssueCacheStore().get(id, issueNumber);
    if (!record) {
      return issueGetResult.parse({ found: false });
    }
    const detail = issueRecordToDetail(record);
    return issueGetResult.parse({ found: true, detail });
  });
}