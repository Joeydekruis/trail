import { BrowserWindow } from "electron";
import type { AppUpdateStateDto } from "@trail/ipc";

export const APP_UPDATE_STATE_CHANNEL = "trail.appUpdateState" as const;

export function broadcastAppUpdateState(payload: AppUpdateStateDto): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(APP_UPDATE_STATE_CHANNEL, payload);
  }
}