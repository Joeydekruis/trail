import { ipcMain } from "electron";
import { APP_SETTING_GITHUB_LOGIN } from "@trail/core";
import {
  IpcChannels,
  githubClearTokenResult,
  githubListReposResult,
  githubSetTokenPayload,
  githubSetTokenResult,
  githubStatusResult,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";
import { fetchGitHubRepos, fetchGitHubUser } from "./github-api";
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
}