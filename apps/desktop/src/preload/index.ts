import { contextBridge, ipcRenderer } from "electron";
import { PreloadIpcChannels } from "./channels";

export type WorkspaceListResult = {
  workspaces: Array<{
    id: string;
    name: string;
    shortLabel: string;
    repository: string | null;
    integrationBranch: string;
    productionBranch: string;
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
    productionBranch?: string;
  }) => Promise<WorkspaceSwitchResult>;
  githubStatus: () => Promise<{ connected: boolean; login?: string }>;
  githubSetToken: (
    token: string,
  ) => Promise<{ ok: true; login: string } | { ok: false; message: string }>;
  githubListRepos: () => Promise<{ repos: GithubRepoDto[] }>;
  githubListBranches: (repository: string) => Promise<{ branches: string[]; error?: string }>;
  githubClearToken: () => Promise<{ cleared: true }>;
  getGithubBoardMapping: (workspaceId?: string) => Promise<{
    projectStatusField: string;
    syncIntervalSec: number;
  }>;
  setGithubBoardMapping: (input: {
    workspaceId?: string;
    projectStatusField?: string;
    syncIntervalSec?: number;
  }) => Promise<{ projectStatusField: string; syncIntervalSec: number }>;
  onBackgroundSync: (
    listener: (payload: { workspaceId: string; syncedAt: string; issueCount: number }) => void,
  ) => () => void;
  createIssue: (input: {
    workspaceId?: string;
    title: string;
    body: string;
    type: import("@trail/ipc").IssueCreatePayload["type"];
    priority: import("@trail/ipc").IssueCreatePayload["priority"];
    agentReady?: boolean;
  }) => Promise<
    | { ok: true; issueNumber: number; htmlUrl: string }
    | { ok: false; message: string }
  >;
  getIssueDetail: (input: {
    workspaceId?: string;
    issueNumber: number;
  }) => Promise<
    | { found: true; detail: import("@trail/ipc").IssueDetailDto }
    | { found: false }
  >;
  moveBoardIssue: (input: {
    workspaceId?: string;
    issueNumber: number;
    targetColumn: import("@trail/ipc").BoardColumnIdDto;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
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
  listWorktrees: (workspaceId?: string) => Promise<{
    worktrees: import("@trail/ipc").WorktreeDto[];
    repoRoot: string | null;
    worktreeRoot: string | null;
  }>;
  createWorktree: (input: {
    workspaceId?: string;
    issueNumber: number;
    title?: string;
  }) => Promise<
    | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
    | { ok: false; message: string }
  >;
  getRepoRoot: (workspaceId?: string) => Promise<{
    repoRoot: string | null;
    worktreeRoot: string | null;
  }>;
  setRepoRoot: (input: {
    workspaceId?: string;
    repoRoot: string | null;
    worktreeRoot?: string;
  }) => Promise<{
    repoRoot: string | null;
    worktreeRoot: string;
    message?: string;
  }>;
  pickRepoRoot: () => Promise<
    | { ok: true; path: string }
    | { ok: false; cancelled: true }
    | { ok: false; message: string }
  >;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<{ ok: true } | { ok: false; message: string }>;
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
  githubListBranches: (repository) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubListBranches, { repository }) as Promise<{
      branches: string[];
      error?: string;
    }>,
  githubClearToken: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubClearToken) as Promise<{
      cleared: true;
    }>,
  getGithubBoardMapping: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubBoardMappingGet, { workspaceId }) as Promise<{
      projectStatusField: string;
      syncIntervalSec: number;
    }>,
  setGithubBoardMapping: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubBoardMappingSet, input) as Promise<{
      projectStatusField: string;
      syncIntervalSec: number;
    }>,
  onBackgroundSync: (listener) => {
    const channel = "trail.backgroundSync";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { workspaceId: string; syncedAt: string; issueCount: number },
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  createIssue: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.issueCreate, input) as Promise<
      | { ok: true; issueNumber: number; htmlUrl: string }
      | { ok: false; message: string }
    >,
  getIssueDetail: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.issueGet, input) as Promise<
      | { found: true; detail: import("@trail/ipc").IssueDetailDto }
      | { found: false }
    >,
  moveBoardIssue: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.boardMoveIssue, input) as Promise<
      { ok: true } | { ok: false; message: string }
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
  listWorktrees: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.worktreeList, { workspaceId }) as Promise<{
      worktrees: import("@trail/ipc").WorktreeDto[];
      repoRoot: string | null;
      worktreeRoot: string | null;
    }>,
  createWorktree: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.worktreeCreate, input) as Promise<
      | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
      | { ok: false; message: string }
    >,
  getRepoRoot: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootGet, { workspaceId }) as Promise<{
      repoRoot: string | null;
      worktreeRoot: string | null;
    }>,
  setRepoRoot: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootSet, input) as Promise<{
      repoRoot: string | null;
      worktreeRoot: string;
      message?: string;
    }>,
  pickRepoRoot: () =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootPick) as Promise<
      | { ok: true; path: string }
      | { ok: false; cancelled: true }
      | { ok: false; message: string }
    >,
  minimize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMinimize) as Promise<void>,
  maximize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMaximize) as Promise<void>,
  close: () => ipcRenderer.invoke(PreloadIpcChannels.windowClose) as Promise<void>,
  openExternal: (url) =>
    ipcRenderer.invoke(PreloadIpcChannels.shellOpenExternal, { url }) as Promise<void>,
  openPath: (path) =>
    ipcRenderer.invoke(PreloadIpcChannels.shellOpenPath, { path }) as Promise<
      { ok: true } | { ok: false; message: string }
    >,
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