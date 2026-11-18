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
};

export type WorkspaceSwitchResult = {
  active: WorkspaceListResult["workspaces"][number];
  workspaces: WorkspaceListResult["workspaces"];
};

export type TrailApi = {
  platform: NodeJS.Platform;
  listWorkspaces: () => Promise<WorkspaceListResult>;
  switchWorkspace: (workspaceId: string) => Promise<WorkspaceSwitchResult>;
  syncNow: (workspaceId?: string) => Promise<void>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
};

const trailApi: TrailApi = {
  platform: process.platform,
  listWorkspaces: () =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceList) as Promise<WorkspaceListResult>,
  switchWorkspace: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceSwitch, {
      workspaceId,
    }) as Promise<WorkspaceSwitchResult>,
  syncNow: async (workspaceId) => {
    await ipcRenderer.invoke(PreloadIpcChannels.syncNow, { workspaceId });
  },
  minimize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMinimize) as Promise<void>,
  maximize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMaximize) as Promise<void>,
  close: () => ipcRenderer.invoke(PreloadIpcChannels.windowClose) as Promise<void>,
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