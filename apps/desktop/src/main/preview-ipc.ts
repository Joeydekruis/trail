import { BrowserWindow, ipcMain } from "electron";
import {
  IpcChannels,
  previewAttachPayload,
  previewAttachResult,
  previewDetachPayload,
  previewNavigatePayload,
  previewNavigateResult,
  previewSetBoundsPayload,
} from "@trail/ipc";
import {
  attachPreview,
  detachPreview,
  navigatePreview,
  setPreviewBounds,
} from "./preview-host";

function hostWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

export function registerPreviewIpc(): void {
  ipcMain.handle(IpcChannels.previewAttach, (event, raw: unknown) => {
    const payload = previewAttachPayload.parse(raw);
    const win = hostWindow(event);
    if (!win) {
      return previewAttachResult.parse({
        ok: false,
        message: "Main window not found",
      });
    }
    const result = attachPreview(win, payload, payload.url);
    return previewAttachResult.parse(result);
  });

  ipcMain.handle(IpcChannels.previewSetBounds, (event, raw: unknown) => {
    const payload = previewSetBoundsPayload.parse(raw);
    const win = hostWindow(event);
    if (!win) {
      return;
    }
    setPreviewBounds(
      win,
      payload,
      {
        x: Math.round(payload.x),
        y: Math.round(payload.y),
        width: Math.round(payload.width),
        height: Math.round(payload.height),
      },
    );
  });

  ipcMain.handle(IpcChannels.previewDetach, (_event, raw: unknown) => {
    const payload = previewDetachPayload.parse(raw);
    detachPreview(payload);
  });

  ipcMain.handle(IpcChannels.previewNavigate, (_event, raw: unknown) => {
    const payload = previewNavigatePayload.parse(raw);
    const result = navigatePreview(payload, payload.url);
    return previewNavigateResult.parse(result);
  });
}