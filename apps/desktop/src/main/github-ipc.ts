import { ipcMain } from "electron";
import { APP_SETTING_GITHUB_LOGIN } from "@trail/core";
import {
  IpcChannels,
  githubClearTokenResult,
  githubListBranchesPayload,
  githubBoardMappingGetPayload,
  githubBoardMappingGetResult,
  githubBoardMappingSetPayload,
  githubBoardMappingSetResult,
  githubListBranchesResult,
  githubListReposResult,
  githubSetTokenPayload,
  githubSetTokenResult,
  githubStatusResult,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";
import { restartBackgroundSync } from "./background-sync";
import {
  readWorkspaceProjectStatusField,
  readWorkspaceSyncIntervalSec,
  writeWorkspaceProjectStatusField,
  writeWorkspaceSyncIntervalSec,
} from "./workspace-github-settings";
import { fetchGitHubBranches, fetchGitHubRepos, fetchGitHubUser } from "./github-api";
import {
  clearGitHubToken,
  readGitHubToken,
  writeGitHubToken,
} from "./github-token-store";

export function registerGitHubIpc(): void {
  ipcMain.handle(IpcChannels.githubStatus, async () => {
    const token = readGitHubToken();
    if (!token) {
      return githubStatusResult.parse({ connected: false });
    }
    const user = await fetchGitHubUser(token);
    if (!user.ok) {
      clearGitHubToken();
      getWorkspaceStore().deleteAppSetting(APP_SETTING_GITHUB_LOGIN);
      return githubStatusResult.parse({ connected: false });
    }
    return githubStatusResult.parse({ connected: true, login: user.login });
  });

  ipcMain.handle(IpcChannels.githubSetToken, async (_event, raw: unknown) => {
    const { token } = githubSetTokenPayload.parse(raw);
    const user = await fetchGitHubUser(token);
    if (!user.ok) {
      return githubSetTokenResult.parse({ ok: false, message: user.message });
    }
    try {
      writeGitHubToken(token);
      getWorkspaceStore().setAppSetting(APP_SETTING_GITHUB_LOGIN, user.login);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not store token";
      return githubSetTokenResult.parse({ ok: false, message });
    }
    return githubSetTokenResult.parse({ ok: true, login: user.login });
  });

  ipcMain.handle(IpcChannels.githubClearToken, () => {
    clearGitHubToken();
    getWorkspaceStore().deleteAppSetting(APP_SETTING_GITHUB_LOGIN);
    return githubClearTokenResult.parse({ cleared: true });
  });

  ipcMain.handle(IpcChannels.githubListBranches, async (_event, raw: unknown) => {
    const { repository } = githubListBranchesPayload.parse(raw);
    const token = readGitHubToken();
    if (!token) {
      return githubListBranchesResult.parse({ branches: [] });
    }
    const slash = repository.indexOf("/");
    if (slash <= 0) {
      return githubListBranchesResult.parse({ branches: [] });
    }
    const owner = repository.slice(0, slash);
    const repo = repository.slice(slash + 1);
    const result = await fetchGitHubBranches(token, owner, repo);
    if (!result.ok) {
      return githubListBranchesResult.parse({ branches: [], error: result.message });
    }
    return githubListBranchesResult.parse({ branches: result.branches });
  });

  ipcMain.handle(IpcChannels.githubListRepos, async () => {
    const token = readGitHubToken();
    if (!token) {
      return githubListReposResult.parse({ repos: [] });
    }
    const result = await fetchGitHubRepos(token);
    if (!result.ok) {
      return githubListReposResult.parse({ repos: [] });
    }
    return githubListReposResult.parse({ repos: result.repos });
  });

  ipcMain.handle(IpcChannels.githubBoardMappingGet, (_event, raw: unknown) => {
    const { workspaceId } = githubBoardMappingGetPayload.parse(raw ?? {});
    const store = getWorkspaceStore();
    const id = workspaceId ?? store.getActiveId();
    return githubBoardMappingGetResult.parse({
      projectStatusField: readWorkspaceProjectStatusField(store, id),
      syncIntervalSec: readWorkspaceSyncIntervalSec(store, id),
    });
  });

  ipcMain.handle(IpcChannels.githubBoardMappingSet, (_event, raw: unknown) => {
    const { workspaceId, projectStatusField, syncIntervalSec } =
      githubBoardMappingSetPayload.parse(raw);
    const store = getWorkspaceStore();
    const id = workspaceId ?? store.getActiveId();
    if (projectStatusField !== undefined) {
      writeWorkspaceProjectStatusField(store, id, projectStatusField);
    }
    if (syncIntervalSec !== undefined) {
      writeWorkspaceSyncIntervalSec(store, id, syncIntervalSec);
      restartBackgroundSync();
    }
    return githubBoardMappingSetResult.parse({
      projectStatusField: readWorkspaceProjectStatusField(store, id),
      syncIntervalSec: readWorkspaceSyncIntervalSec(store, id),
    });
  });
}