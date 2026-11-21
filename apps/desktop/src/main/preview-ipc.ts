import { BrowserWindow, ipcMain } from "electron";
import {
  IpcChannels,
  previewAttachPayload,
  previewAttachResult,
  previewCommentModePayload,
  previewDetachPayload,
  previewEnsureDevServerPayload,
  previewEnsureDevServerResult,
  previewNavigatePayload,
  previewNavigateResult,
  previewE2eSimulatePinPayload,
  previewPinSubmitPayload,
  previewPinSubmitResult,
  previewSetBoundsPayload,
} from "@trail/ipc";
import {
  attachPreview,
  detachPreview,
  getPreviewRefForWebContents,
  isPreviewWebContents,
  navigatePreview,
  setPreviewBounds,
  setPreviewCommentMode,
} from "./preview-host";
import { ensurePreviewDevServer, stopPreviewDevServer } from "./preview-dev-server";
import { submitPreviewPin } from "./preview-pin-submit";

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
    stopPreviewDevServer(payload);
  });

  ipcMain.handle(IpcChannels.previewEnsureDevServer, async (_event, raw: unknown) => {
    const payload = previewEnsureDevServerPayload.parse(raw);
    const result = await ensurePreviewDevServer(payload);
    return previewEnsureDevServerResult.parse(result);
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
    return submitPreviewPin(ref, payload);
  });

  ipcMain.handle(IpcChannels.previewE2eSimulatePin, (event, raw: unknown) => {
    if (process.env.TRAIL_E2E !== "1") {
      return previewPinSubmitResult.parse({
        ok: false,
        message: "E2E pin simulation is disabled",
      });
    }
    const win = hostWindow(event);
    if (!win) {
      return previewPinSubmitResult.parse({
        ok: false,
        message: "Main window not found",
      });
    }
    const payload = previewE2eSimulatePinPayload.parse(raw);
    const pinPayload = previewPinSubmitPayload.parse({
      comment: payload.comment,
      anchor: {
        selector: payload.anchor?.selector ?? "[data-e2e-root]",
        xpath: payload.anchor?.xpath ?? "/html/body",
        elementText: payload.anchor?.elementText ?? "e2e",
        offsetX: payload.anchor?.offsetX ?? 12,
        offsetY: payload.anchor?.offsetY ?? 12,
        viewportWidth: payload.anchor?.viewportWidth ?? 800,
        viewportHeight: payload.anchor?.viewportHeight ?? 600,
        pageUrl: payload.anchor?.pageUrl ?? "http://127.0.0.1:3000/",
      },
    });
    return submitPreviewPin(
      { workspaceId: payload.workspaceId, issueNumber: payload.issueNumber },
      pinPayload,
    );
  });
}