import {
  resolveProjectStatusField,
  resolveSyncIntervalSec,
  workspaceProjectStatusFieldKey,
  workspaceSyncIntervalKey,
  type WorkspaceStore,
} from "@trail/core";

export function readWorkspaceProjectStatusField(
  store: WorkspaceStore,
  workspaceId: string,
): string {
  return resolveProjectStatusField(store.getAppSetting(workspaceProjectStatusFieldKey(workspaceId)));
}

export function writeWorkspaceProjectStatusField(
  store: WorkspaceStore,
  workspaceId: string,
  fieldName: string,
): void {
  const trimmed = fieldName.trim();
  store.setAppSetting(
    workspaceProjectStatusFieldKey(workspaceId),
    resolveProjectStatusField(trimmed),
  );
}

export function readWorkspaceSyncIntervalSec(store: WorkspaceStore, workspaceId: string): number {
  return resolveSyncIntervalSec(store.getAppSetting(workspaceSyncIntervalKey(workspaceId)));
}

export function writeWorkspaceSyncIntervalSec(
  store: WorkspaceStore,
  workspaceId: string,
  seconds: number,
): number {
  const normalized = resolveSyncIntervalSec(String(seconds));
  store.setAppSetting(workspaceSyncIntervalKey(workspaceId), String(normalized));
  return normalized;
}