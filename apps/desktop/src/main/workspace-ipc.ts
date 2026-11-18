import { ipcMain } from "electron";
import type { WorkspaceRecord } from "@trail/core";
import {
  IpcChannels,
  workspaceListResult,
  workspaceSwitchPayload,
  workspaceSwitchResult,
  type WorkspaceDto,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";

function toDto(record: WorkspaceRecord): WorkspaceDto {
  return {
    id: record.id,
    name: record.name,
    shortLabel: record.shortLabel,
    repository: record.repository,
    integrationBranch: record.integrationBranch,
    accent: record.accent,
    accentSoft: record.accentSoft,
    accentLine: record.accentLine,
    onAccent: record.onAccent,
  };
}

function snapshot() {
  const store = getWorkspaceStore();
  const workspaces = store.list().map(toDto);
  const activeWorkspaceId = store.getActiveId();
  return workspaceListResult.parse({ workspaces, activeWorkspaceId });
}

export function registerWorkspaceIpc(): void {
  ipcMain.handle(IpcChannels.workspaceList, () => snapshot());

  ipcMain.handle(IpcChannels.workspaceSwitch, (_event, raw: unknown) => {
    const { workspaceId } = workspaceSwitchPayload.parse(raw);
    const store = getWorkspaceStore();
    const active = store.switchTo(workspaceId);
    const workspaces = store.list().map(toDto);
    return workspaceSwitchResult.parse({ active: toDto(active), workspaces });
  });
}