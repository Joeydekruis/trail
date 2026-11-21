import { existsSync } from "node:fs";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import {
  IpcChannels,
  shellOpenExternalPayload,
  shellOpenPathPayload,
  shellOpenPathResult,
  syncNowPayload,
  syncNowResult,
} from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore, initDatabase } from "./database";
import { syncWorkspaceNow } from "./sync-now";
import { scheduleDeferredStartup } from "./deferred-startup";
import { registerBoardIpc } from "./board-ipc";
import { registerIssueIpc } from "./issue-ipc";
import { registerWorktreeIpc } from "./worktree-ipc";
import { registerAgentIpc } from "./agent-ipc";
import { registerPreviewIpc } from "./preview-ipc";
import { disposeAllPreviews, onPreviewWindowClosed } from "./preview-host";
import { registerGitHubIpc } from "./github-ipc";
import { registerWorkspaceIpc } from "./workspace-ipc";

const MIN_WIDTH = 1180;
const MIN_HEIGHT = 640;

function resolvePreloadPath(): string {
  const candidate = join(__dirname, "../preload/index.js");
  if (!existsSync(candidate)) {
    console.error("[trail] Preload script missing:", candidate);
  }
  return candidate;
}

function createWindow(): void {
  const preloadPath = resolvePreloadPath();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : undefined,
    backgroundColor: "#0b0d10",
    show: false,
    title: "Trail",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
    },
  });

  win.webContents.on("preload-error", (_event, path, error) => {
    console.error("[trail] Preload failed:", path, error);
  });

  win.on("ready-to-show", () => {
    win.show();
    scheduleDeferredStartup();
  });

  win.on("closed", () => {
    onPreviewWindowClosed(win);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:") || url.startsWith("http:")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) {
    console.info("[trail] Loading renderer:", devUrl);
    void win.loadURL(devUrl);
  } else {
    const file = join(__dirname, "../renderer/index.html");
    console.info("[trail] Loading renderer file:", file);
    void win.loadFile(file);
  }
}

ipcMain.handle(IpcChannels.shellOpenExternal, (_event, raw: unknown) => {
  const { url } = shellOpenExternalPayload.parse(raw);
  void shell.openExternal(url);
});

ipcMain.handle(IpcChannels.shellOpenPath, (_event, raw: unknown) => {
  const { path } = shellOpenPathPayload.parse(raw);
  const error = shell.openPath(path);
  if (error) {
    return shellOpenPathResult.parse({ ok: false, message: error });
  }
  return shellOpenPathResult.parse({ ok: true });
});

ipcMain.handle(IpcChannels.syncNow, async (_event, raw: unknown) => {
  const { workspaceId } = syncNowPayload.parse(raw);
  const result = await syncWorkspaceNow(
    getWorkspaceStore(),
    getIssueCacheStore(),
    workspaceId,
  );
  return syncNowResult.parse(result);
});

ipcMain.handle(IpcChannels.windowMinimize, (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.handle(IpcChannels.windowMaximize, (event) => {
  const target = BrowserWindow.fromWebContents(event.sender);
  if (!target) {
    return;
  }
  if (target.isMaximized()) {
    target.unmaximize();
  } else {
    target.maximize();
  }
});

ipcMain.handle(IpcChannels.windowClose, (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

void app.whenReady().then(() => {
  initDatabase();
  registerWorkspaceIpc();
  registerGitHubIpc();
  registerBoardIpc();
  registerIssueIpc();
  registerWorktreeIpc();
  registerAgentIpc();
  registerPreviewIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  disposeAllPreviews();
});