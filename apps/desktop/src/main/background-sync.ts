import { BrowserWindow } from "electron";
import { getIssueCacheStore, getWorkspaceStore } from "./database";
import { readGitHubToken } from "./github-token-store";
import { syncWorkspaceNow } from "./sync-now";
import { runAutopilotTick } from "./autopilot-service";
import { readWorkspaceSyncIntervalSec } from "./workspace-github-settings";

const BACKGROUND_SYNC_CHANNEL = "trail.backgroundSync";

let pollTimer: NodeJS.Timeout | null = null;
let syncInFlight = false;

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

  const intervalSec = readWorkspaceSyncIntervalSec(store, workspaceId);
  const waitMs = delayMs ?? (intervalSec > 0 ? intervalSec * 1_000 : 60_000);

  pollTimer = setTimeout(() => {
    void runBackgroundSync().finally(() => {
      const activeId = getWorkspaceStore().getActiveId();
      if (readWorkspaceSyncIntervalSec(getWorkspaceStore(), activeId) > 0) {
        scheduleNextWake();
      } else {
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
  if (syncInFlight) {
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
      workspaceId,
    );
    if (result.ok) {
      notifyBackgroundSync({
        workspaceId,
        syncedAt: result.syncedAt,
        issueCount: result.issueCount,
      });
      void runAutopilotTick(workspaceId);
    }
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

export function startBackgroundSync(): void {
  restartBackgroundSync();
}