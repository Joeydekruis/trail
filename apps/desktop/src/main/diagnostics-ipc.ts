import { existsSync, statSync } from "node:fs";
import { ipcMain, app } from "electron";
import {
  diagnosticsGetSnapshotPayload,
  diagnosticsGetSnapshotResult,
  diagnosticsMarkRendererReadyPayload,
  diagnosticsReportWorkspaceSwitchPayload,
  IpcChannels,
} from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore } from "./database";
import { getSqliteDatabasePath } from "./database-path";
import {
  markRendererReady,
  recordWorkspaceSwitchDuration,
  getStartupTimingSnapshot,
} from "./startup-timing";

let reportedOpenViewCount: number | null = null;

function processMetrics(): Array<{ type: string; cpu: number; memoryMb: number }> {
  return app.getAppMetrics().map((metric) => ({
    type: metric.type,
    cpu: Math.round((metric.cpu.percentCPUUsage ?? 0) * 10) / 10,
    memoryMb: Math.round((metric.memory.workingSetSize ?? 0) / 1024),
  }));
}

function sqliteByteSize(): { path: string | null; bytes: number | null } {
  const path = getSqliteDatabasePath();
  if (!path || !existsSync(path)) {
    return { path, bytes: null };
  }
  try {
    return { path, bytes: statSync(path).size };
  } catch {
    return { path, bytes: null };
  }
}

export function registerDiagnosticsIpc(): void {
  ipcMain.handle(IpcChannels.diagnosticsMarkRendererReady, (_event, raw: unknown) => {
    const payload = diagnosticsMarkRendererReadyPayload.parse(raw ?? {});
    markRendererReady(payload.at ?? Date.now());
    return { ok: true as const };
  });

  ipcMain.handle(IpcChannels.diagnosticsReportWorkspaceSwitch, (_event, raw: unknown) => {
    const payload = diagnosticsReportWorkspaceSwitchPayload.parse(raw);
    recordWorkspaceSwitchDuration(payload.durationMs);
    if (payload.openViewCount !== undefined) {
      reportedOpenViewCount = payload.openViewCount;
    }
    return { ok: true as const };
  });

  ipcMain.handle(IpcChannels.diagnosticsGetSnapshot, (_event, raw: unknown) => {
    const payload = diagnosticsGetSnapshotPayload.parse(raw ?? {});
    if (payload.openViewCount !== undefined) {
      reportedOpenViewCount = payload.openViewCount;
    }
    const store = getWorkspaceStore();
    const activeId = store.getActiveId();
    const sqlite = sqliteByteSize();
    const startup = getStartupTimingSnapshot();

    const snapshot = {
      collectedAt: new Date().toISOString(),
      startup,
      sqlitePath: sqlite.path,
      sqliteBytes: sqlite.bytes,
      workspacesCount: store.list().length,
      activeWorkspaceId: activeId,
      openIssueCount: getIssueCacheStore().countOpen(activeId),
      openViewCount: reportedOpenViewCount,
      processes: processMetrics(),
    };

    return diagnosticsGetSnapshotResult.parse(snapshot);
  });
}