import { ipcMain } from "electron";
import {
  IpcChannels,
  agentRunStartPayload,
  agentRunStartResult,
  agentRunStopPayload,
  agentRunStopResult,
  agentStatusResult,
} from "@trail/ipc";
import { detectAgentBackends } from "./agent-cli";
import { startAgentRun, stopAgentRun } from "./agent-run";
import { getWorktreeStore, getWorkspaceStore } from "./database";

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

export function registerAgentIpc(): void {
  ipcMain.handle(IpcChannels.agentStatus, () => {
    const backends = detectAgentBackends();
    return agentStatusResult.parse({ backends });
  });

  ipcMain.handle(IpcChannels.agentRunStart, async (_event, raw: unknown) => {
    const payload = agentRunStartPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const start = startAgentRun({
      workspaceId,
      issueNumber: payload.issueNumber,
      prompt: payload.prompt,
    });
    if (!start.ok) {
      return agentRunStartResult.parse({ ok: false, message: start.message });
    }
    getWorktreeStore().updateStatus(workspaceId, payload.issueNumber, "running");
    return agentRunStartResult.parse({ ok: true });
  });

  ipcMain.handle(IpcChannels.agentRunStop, (_event, raw: unknown) => {
    const payload = agentRunStopPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const stopped = stopAgentRun(workspaceId, payload.issueNumber);
    if (stopped) {
      getWorktreeStore().updateStatus(workspaceId, payload.issueNumber, "stopped");
    }
    return agentRunStopResult.parse({ stopped });
  });
}