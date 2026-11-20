import { ipcMain } from "electron";
import { APP_SETTING_GITHUB_LOGIN, type WorkspaceRecord } from "@trail/core";
import { readGitHubToken } from "./github-token-store";
import {
  IpcChannels,
  workspaceCreatePayload,
  workspaceCreateResult,
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
    productionBranch: record.productionBranch,
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
  const tokenPresent = Boolean(readGitHubToken());
  const cachedLogin = store.getAppSetting(APP_SETTING_GITHUB_LOGIN);
  const github = tokenPresent
    ? { connected: true, ...(cachedLogin ? { login: cachedLogin } : {}) }
    : { connected: false };
  return workspaceListResult.parse({
    workspaces,
    activeWorkspaceId,
    needsOnboarding: !store.hasLinkedWorkspace(),
    github,
    activeLastSyncedAt: store.getLastSyncAt(activeWorkspaceId),
  });
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

  ipcMain.handle(IpcChannels.workspaceCreate, (_event, raw: unknown) => {
    const payload = workspaceCreatePayload.parse(raw);
    const store = getWorkspaceStore();
    const active = store.create(payload);
    const workspaces = store.list().map(toDto);
    return workspaceCreateResult.parse({ active: toDto(active), workspaces });
  });
}