import { contextBridge, ipcRenderer } from "electron";
import { PreloadIpcChannels } from "./channels";

export type WorkspaceListResult = {
  workspaces: Array<{
    id: string;
    name: string;
    shortLabel: string;
    repository: string | null;
    integrationBranch: string;
    accent: string;
    accentSoft: string;
    accentLine: string;
    onAccent: string;
  }>;
  activeWorkspaceId: string;
  needsOnboarding: boolean;
  github: { connected: boolean; login?: string };
  activeLastSyncedAt: string | null;
};

export type WorkspaceSwitchResult = {
  active: WorkspaceListResult["workspaces"][number];
  workspaces: WorkspaceListResult["workspaces"];
};

export type GithubRepoDto = {
  fullName: string;
  description: string | null;
  openIssuesCount: number;
};

export type TrailApi = {
  platform: NodeJS.Platform;
  listWorkspaces: () => Promise<WorkspaceListResult>;
  switchWorkspace: (workspaceId: string) => Promise<WorkspaceSwitchResult>;
  createWorkspace: (input: {
    repository: string;
    name?: string;
    integrationBranch?: string;
  }) => Promise<WorkspaceSwitchResult>;
  githubStatus: () => Promise<{ connected: boolean; login?: string }>;
  githubSetToken: (
    token: string,
  ) => Promise<{ ok: true; login: string } | { ok: false; message: string }>;
  githubListRepos: () => Promise<{ repos: GithubRepoDto[] }>;
  githubClearToken: () => Promise<{ cleared: true }>;
  getIssueDetail: (input: {
    workspaceId?: string;
    issueNumber: number;
  }) => Promise<
    | { found: true; detail: import("@trail/ipc").IssueDetailDto }
    | { found: false }
  >;
  getBoardSnapshot: (workspaceId?: string) => Promise<{
    source: "cache" | "fixture";
    repository: string | null;
    openCount: number;
    columns: Array<{
      id: string;
      name: string;
      count: number;
      tone: "gray" | "blue" | "mint" | "violet" | "amber";
      ghLabel: string;
      cards: Array<{
        issue: string;
        title: string;
        prioColor: string;
        prioLabel: string;
        labels: Array<{ text: string; tone: "blue" | "mint" | "gray" | "violet" }>;
      }>;
    }>;
  }>;
  syncNow: (
    workspaceId?: string,
  ) => Promise<
    | { ok: true; syncedAt: string; issueCount: number }
    | { ok: false; message: string }
  >;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
};

const trailApi: TrailApi = {
  platform: process.platform,
  listWorkspaces: () =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceList) as Promise<WorkspaceListResult>,
  switchWorkspace: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceSwitch, {
      workspaceId,
    }) as Promise<WorkspaceSwitchResult>,
  createWorkspace: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceCreate, input) as Promise<WorkspaceSwitchResult>,
  githubStatus: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubStatus) as Promise<{
      connected: boolean;
      login?: string;
    }>,
  githubSetToken: (token) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubSetToken, { token }) as Promise<
      { ok: true; login: string } | { ok: false; message: string }
    >,
  githubListRepos: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubListRepos) as Promise<{
      repos: GithubRepoDto[];
    }>,
  githubClearToken: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubClearToken) as Promise<{
      cleared: true;
    }>,
  getIssueDetail: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.issueGet, input) as Promise<
      | { found: true; detail: import("@trail/ipc").IssueDetailDto }
      | { found: false }
    >,
  getBoardSnapshot: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.boardSnapshot, { workspaceId }) as Promise<{
      source: "cache" | "fixture";
      repository: string | null;
      openCount: number;
      columns: Array<{
        id: string;
        name: string;
        count: number;
        tone: "gray" | "blue" | "mint" | "violet" | "amber";
        ghLabel: string;
        cards: Array<{
          issue: string;
          title: string;
          prioColor: string;
          prioLabel: string;
          labels: Array<{ text: string; tone: "blue" | "mint" | "gray" | "violet" }>;
        }>;
      }>;
    }>,
  syncNow: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.syncNow, { workspaceId }) as Promise<
      | { ok: true; syncedAt: string; issueCount: number }
      | { ok: false; message: string }
    >,
  minimize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMinimize) as Promise<void>,
  maximize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMaximize) as Promise<void>,
  close: () => ipcRenderer.invoke(PreloadIpcChannels.windowClose) as Promise<void>,
  openExternal: (url) =>
    ipcRenderer.invoke(PreloadIpcChannels.shellOpenExternal, { url }) as Promise<void>,
};

try {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("trail", trailApi);
  } else {
    // Legacy path when context isolation is off (should not happen in production).
    const g = globalThis as typeof globalThis & { trail?: TrailApi };
    g.trail = trailApi;
  }
  console.info("[trail] Preload bridge exposed");
} catch (error) {
  console.error("[trail] Preload failed to expose bridge:", error);
}