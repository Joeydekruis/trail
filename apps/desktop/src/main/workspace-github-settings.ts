import {
  resolveProjectStatusField,
  workspaceProjectStatusFieldKey,
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