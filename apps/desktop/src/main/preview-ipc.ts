import { BrowserWindow, ipcMain } from "electron";
import {
  IpcChannels,
  previewAttachPayload,
  previewAttachResult,
  previewCommentModePayload,
  previewDetachPayload,
  previewNavigatePayload,
  previewNavigateResult,
  previewPinSubmitPayload,
  previewPinSubmitResult,
  previewSetBoundsPayload,
} from "@trail/ipc";
import { getPreviewPinStore } from "./database";
import {
  attachPreview,
  detachPreview,
  getPreviewRefForWebContents,
  isPreviewWebContents,
  navigatePreview,
  setPreviewBounds,
  setPreviewCommentMode,
} from "./preview-host";
import { broadcastPreviewPin } from "./preview-pin-shared";

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

  ipcMain.handle(IpcChannels.previewCommentMode, (_event, raw: unknown) => {
    const payload = previewCommentModePayload.parse(raw);
    setPreviewCommentMode(payload, payload.enabled);
  });

  ipcMain.handle(IpcChannels.previewPinSubmit, (event, raw: unknown) => {
    if (!isPreviewWebContents(event.sender.id)) {
      return previewPinSubmitResult.parse({
        ok: false,
        message: "Preview sender not allowed",
      });
    }
    const ref = getPreviewRefForWebContents(event.sender.id);
    if (!ref) {
      return previewPinSubmitResult.parse({
        ok: false,
        message: "Unknown preview worktree",
      });
    }
    const payload = previewPinSubmitPayload.parse(raw);
    const stored = getPreviewPinStore().create({
      workspaceId: ref.workspaceId,
      issueNumber: ref.issueNumber,
      comment: payload.comment,
      anchor: {
        selector: payload.anchor.selector,
        xpath: payload.anchor.xpath,
        elementText: payload.anchor.elementText,
        offsetX: payload.anchor.offsetX,
        offsetY: payload.anchor.offsetY,
        viewportWidth: payload.anchor.viewportWidth,
        viewportHeight: payload.anchor.viewportHeight,
        pageUrl: payload.anchor.pageUrl,
      },
    });
    broadcastPreviewPin({
      workspaceId: ref.workspaceId,
      issueNumber: ref.issueNumber,
      pinNumber: stored.pinNumber,
      comment: stored.comment,
      pageUrl: stored.anchor.pageUrl,
      selector: stored.anchor.selector,
      elementText: stored.anchor.elementText,
      offsetX: stored.anchor.offsetX,
      offsetY: stored.anchor.offsetY,
    });
    return previewPinSubmitResult.parse({ ok: true, pinNumber: stored.pinNumber });
  });
}