import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels, type WorkspaceListResult, type WorkspaceSwitchResult } from "@trail/ipc";

export type TrailApi = {
  platform: NodeJS.Platform;
  listWorkspaces: () => Promise<WorkspaceListResult>;
  switchWorkspace: (workspaceId: string) => Promise<WorkspaceSwitchResult>;
  syncNow: (workspaceId?: string) => Promise<void>;
};

const trailApi: TrailApi = {
  platform: process.platform,
  listWorkspaces: () =>
    ipcRenderer.invoke(IpcChannels.workspaceList) as Promise<WorkspaceListResult>,
  switchWorkspace: (workspaceId) =>
    ipcRenderer.invoke(IpcChannels.workspaceSwitch, {
      workspaceId,
    }) as Promise<WorkspaceSwitchResult>,
  syncNow: async (workspaceId) => {
    await ipcRenderer.invoke(IpcChannels.syncNow, { workspaceId });
  },
};

contextBridge.exposeInMainWorld("trail", trailApi);