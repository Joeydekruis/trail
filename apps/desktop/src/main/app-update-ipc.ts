import { ipcMain } from "electron";
import { appUpdateInstallResult, appUpdateStateDto, IpcChannels } from "@trail/ipc";
import { getAppUpdateState, installDownloadedUpdateNow } from "./auto-updater";

export function registerAppUpdateIpc(): void {
  ipcMain.handle(IpcChannels.appUpdateGet, () => {
    return appUpdateStateDto.parse(getAppUpdateState());
  });

  ipcMain.handle(IpcChannels.appUpdateInstall, () => {
    const result = installDownloadedUpdateNow();
    return appUpdateInstallResult.parse(result);
  });
}