import { app } from "electron";
import { autoUpdater } from "electron-updater";
import { countActiveAgentRuns } from "./agent-runner-bridge";
import {
  shouldDeferAppUpdateInstall,
  shouldQuitAndInstallUpdate,
} from "./auto-updater-policy";

let updateDownloaded = false;
let installScheduled = false;

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000;

export function tryInstallDownloadedUpdate(): void {
  if (installScheduled) {
    return;
  }
  const activeAgentRuns = countActiveAgentRuns();
  if (shouldDeferAppUpdateInstall({ updateDownloaded, activeAgentRuns })) {
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

export function registerAutoUpdater(): void {
  if (!app.isPackaged || process.env.TRAIL_E2E === "1") {
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("error", (error) => {
    console.warn("[trail] auto-update error:", error.message);
  });

  autoUpdater.on("update-downloaded", () => {
    updateDownloaded = true;
    tryInstallDownloadedUpdate();
  });

  const check = (): void => {
    void autoUpdater.checkForUpdates().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[trail] auto-update check failed:", message);
    });
  };

  setTimeout(check, 30_000);
  setInterval(check, CHECK_INTERVAL_MS).unref?.();
}