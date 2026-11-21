import { app } from "electron";
import { autoUpdater } from "electron-updater";
import type { AppUpdateStateDto, AppUpdateStatus } from "@trail/ipc";
import { countActiveAgentRuns } from "./agent-runner-bridge";
import {
  shouldDeferAppUpdateInstall,
  shouldQuitAndInstallUpdate,
} from "./auto-updater-policy";
import { broadcastAppUpdateState } from "./app-update-shared";

let updateDownloaded = false;
let installScheduled = false;
let updateStatus: AppUpdateStatus = "idle";
let pendingVersion: string | null = null;
let lastError: string | null = null;

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000;

function updatesEnabled(): boolean {
  return app.isPackaged && process.env.TRAIL_E2E !== "1";
}

function buildAppUpdateState(): AppUpdateStateDto {
  const activeAgentRuns = countActiveAgentRuns();
  return {
    enabled: updatesEnabled(),
    status: updateDownloaded ? "downloaded" : updateStatus,
    currentVersion: app.getVersion(),
    version: pendingVersion,
    deferredByRuns: shouldDeferAppUpdateInstall({ updateDownloaded, activeAgentRuns }),
    errorMessage: lastError,
  };
}

function publishAppUpdateState(): void {
  broadcastAppUpdateState(buildAppUpdateState());
}

export function getAppUpdateState(): AppUpdateStateDto {
  return buildAppUpdateState();
}

export function tryInstallDownloadedUpdate(): void {
  if (installScheduled) {
    return;
  }
  const activeAgentRuns = countActiveAgentRuns();
  if (shouldDeferAppUpdateInstall({ updateDownloaded, activeAgentRuns })) {
    publishAppUpdateState();
    return;
  }
  if (!shouldQuitAndInstallUpdate({ updateDownloaded, activeAgentRuns })) {
    return;
  }
  if (!app.isPackaged) {
    return;
  }
  installScheduled = true;
  autoUpdater.quitAndInstall(false, true);
}

export function installDownloadedUpdateNow():
  | { ok: true }
  | { ok: false; message: string } {
  if (!updateDownloaded) {
    return { ok: false, message: "No update has been downloaded yet" };
  }
  if (countActiveAgentRuns() > 0) {
    return {
      ok: false,
      message: "Wait for agent runs to finish before installing the update",
    };
  }
  tryInstallDownloadedUpdate();
  if (installScheduled) {
    return { ok: true };
  }
  return { ok: false, message: "Update install could not start" };
}

export function registerAutoUpdater(): void {
  if (!updatesEnabled()) {
    publishAppUpdateState();
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("error", (error) => {
    lastError = error.message;
    updateStatus = "error";
    console.warn("[trail] auto-update error:", error.message);
    publishAppUpdateState();
  });

  autoUpdater.on("checking-for-update", () => {
    lastError = null;
    updateStatus = "checking";
    publishAppUpdateState();
  });

  autoUpdater.on("update-available", (info) => {
    pendingVersion = info.version ?? null;
    updateStatus = "available";
    publishAppUpdateState();
  });

  autoUpdater.on("update-not-available", () => {
    updateStatus = "not-available";
    publishAppUpdateState();
  });

  autoUpdater.on("download-progress", () => {
    updateStatus = "downloading";
    publishAppUpdateState();
  });

  autoUpdater.on("update-downloaded", (info) => {
    pendingVersion = info.version ?? pendingVersion;
    updateDownloaded = true;
    updateStatus = "downloaded";
    publishAppUpdateState();
    tryInstallDownloadedUpdate();
  });

  publishAppUpdateState();

  const check = (): void => {
    void autoUpdater.checkForUpdates().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      lastError = message;
      updateStatus = "error";
      console.warn("[trail] auto-update check failed:", message);
      publishAppUpdateState();
    });
  };

  setTimeout(check, 30_000);
  setInterval(check, CHECK_INTERVAL_MS).unref?.();
}