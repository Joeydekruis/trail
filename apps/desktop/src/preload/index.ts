import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "@trail/ipc";

export type TrailApi = {
  platform: NodeJS.Platform;
  syncNow: (workspaceId?: string) => Promise<void>;
};

const trailApi: TrailApi = {
  platform: process.platform,
  syncNow: async (workspaceId) => {
    await ipcRenderer.invoke(IpcChannels.syncNow, { workspaceId });
  },
};

contextBridge.exposeInMainWorld("trail", trailApi);