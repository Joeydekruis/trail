import { ipcMain } from "electron";
import {
  IpcChannels,
  syncConflictListPayload,
  syncConflictListResult,
  syncConflictResolvePayload,
  syncConflictResolveResult,
  type SyncConflictDto,
} from "@trail/ipc";
import type { IssueSyncConflictRecord } from "@trail/core";
import { getIssueCacheStore, getIssueSyncConflictStore, getWorkspaceStore } from "./database";
import { resolveIssueSyncConflict } from "./sync-conflict-resolve";

function toDto(record: IssueSyncConflictRecord): SyncConflictDto {
  return {
    workspaceId: record.workspaceId,
    issueNumber: record.issueNumber,
    title: record.title,
    github: record.github,
    trail: record.trail,
    detectedAt: record.detectedAt,
  };
}

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

export function registerSyncConflictIpc(): void {
  ipcMain.handle(IpcChannels.syncConflictList, (_event, raw: unknown) => {
    const payload = syncConflictListPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const conflicts = getIssueSyncConflictStore()
      .listByWorkspace(workspaceId)
      .map(toDto);
    return syncConflictListResult.parse({ conflicts });
  });

  ipcMain.handle(IpcChannels.syncConflictResolve, async (_event, raw: unknown) => {
    const payload = syncConflictResolvePayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const result = await resolveIssueSyncConflict({
      workspaces: getWorkspaceStore(),
      issues: getIssueCacheStore(),
      conflicts: getIssueSyncConflictStore(),
      workspaceId,
      issueNumber: payload.issueNumber,
      useGitHubForAll: payload.useGitHubForAll,
      picks: payload.picks,
    });
    return syncConflictResolveResult.parse(result);
  });
}