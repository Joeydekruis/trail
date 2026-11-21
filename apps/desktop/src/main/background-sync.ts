import { app, BrowserWindow, powerMonitor } from "electron";
import { resolveBackgroundSyncIntervalSec } from "@trail/core";
import { getIssueCacheStore, getIssueSyncConflictStore, getWorkspaceStore } from "./database";
import { readGitHubToken } from "./github-token-store";
import { syncWorkspaceNow } from "./sync-now";
import { runAutopilotTick } from "./autopilot-service";
import { readWorkspaceSyncIntervalSec } from "./workspace-github-settings";
import {
  clearGitHubRateLimitPause,
  noteGitHubRateLimit,
  rateLimitPauseRemainingMs,
} from "./github-rate-limit-pause";

const BACKGROUND_SYNC_CHANNEL = "trail.backgroundSync";
const BACKGROUND_SYNC_ERROR_CHANNEL = "trail.backgroundSyncError";

let pollTimer: NodeJS.Timeout | null = null;
let syncInFlight = false;
let powerSuspended = false;
let lifecycleHooksInstalled = false;

function appHasFocusedWindow(): boolean {
  return BrowserWindow.getFocusedWindow() !== null;
}

function backgroundSyncDelayMs(workspaceId: string, overrideMs?: number): number | null {
  if (overrideMs !== undefined) {
    return overrideMs;
  }
  const store = getWorkspaceStore();
  const configured = readWorkspaceSyncIntervalSec(store, workspaceId);
  const intervalSec = resolveBackgroundSyncIntervalSec(
    configured,
    appHasFocusedWindow(),
    powerSuspended,
  );
  if (intervalSec === null) {
    return null;
  }
  return intervalSec * 1_000;
}

export function restartBackgroundSync(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  scheduleNextWake();
}

function scheduleNextWake(delayMs?: number): void {
  const store = getWorkspaceStore();
  let workspaceId: string;
  try {
    workspaceId = store.getActiveId();
  } catch {
    pollTimer = setTimeout(() => scheduleNextWake(60_000), 60_000);
    return;
  }

  const waitMs = backgroundSyncDelayMs(workspaceId, delayMs);
  if (waitMs === null) {
    return;
  }

  pollTimer = setTimeout(() => {
    void runBackgroundSync().finally(() => {
      try {
        const activeId = getWorkspaceStore().getActiveId();
        if (backgroundSyncDelayMs(activeId) === null) {
          return;
        }
        const rateLimitWait = rateLimitPauseRemainingMs(activeId);
        if (rateLimitWait !== null) {
          scheduleNextWake(rateLimitWait);
          return;
        }
        scheduleNextWake();
      } catch {
        scheduleNextWake(60_000);
      }
    });
  }, waitMs);
}

async function runBackgroundSync(): Promise<void> {
  let workspaceId: string;
  try {
    workspaceId = getWorkspaceStore().getActiveId();
  } catch {
    return;
  }
  if (syncInFlight || powerSuspended) {
    return;
  }
  const rateLimitWait = rateLimitPauseRemainingMs(workspaceId);
  if (rateLimitWait !== null) {
    scheduleNextWake(rateLimitWait);
    return;
  }
  const token = readGitHubToken();
  if (!token) {
    return;
  }

  const workspace = getWorkspaceStore().list().find((row) => row.id === workspaceId);
  if (!workspace?.repository) {
    return;
  }

  syncInFlight = true;
  try {
    const result = await syncWorkspaceNow(
      getWorkspaceStore(),
      getIssueCacheStore(),
      getIssueSyncConflictStore(),
      workspaceId,
    );
    if (result.ok) {
      clearGitHubRateLimitPause(workspaceId);
      notifyBackgroundSync({
        workspaceId,
        syncedAt: result.syncedAt,
        issueCount: result.issueCount,
      });
      void runAutopilotTick(workspaceId);
      return;
    }
    if (result.rateLimited && result.retryAfterSec) {
      noteGitHubRateLimit(workspaceId, result.retryAfterSec);
    }
    notifyBackgroundSyncError({
      workspaceId,
      message: result.message,
      retryAfterSec: result.retryAfterSec,
      rateLimited: result.rateLimited,
    });
  } finally {
    syncInFlight = false;
  }
}

function notifyBackgroundSync(payload: {
  workspaceId: string;
  syncedAt: string;
  issueCount: number;
}): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(BACKGROUND_SYNC_CHANNEL, payload);
  }
}

function notifyBackgroundSyncError(payload: {
  workspaceId: string;
  message: string;
  retryAfterSec?: number;
  rateLimited?: boolean;
}): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(BACKGROUND_SYNC_ERROR_CHANNEL, payload);
  }
}

function installLifecycleHooks(): void {
  if (lifecycleHooksInstalled) {
    return;
  }
  lifecycleHooksInstalled = true;

  powerMonitor.on("suspend", () => {
    powerSuspended = true;
    restartBackgroundSync();
  });
  powerMonitor.on("resume", () => {
    powerSuspended = false;
    restartBackgroundSync();
    void runBackgroundSync();
  });

  app.on("browser-window-focus", () => {
    restartBackgroundSync();
  });
  app.on("browser-window-blur", () => {
    restartBackgroundSync();
  });
}

export function startBackgroundSync(): void {
  installLifecycleHooks();
  restartBackgroundSync();
}