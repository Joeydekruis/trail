import { ipcMain } from "electron";
import {
  autopilotGetPayload,
  autopilotGetResult,
  autopilotSetPayload,
  autopilotSetResult,
  IpcChannels,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";
import { anyAgentBackendAvailable } from "@trail/core";
import { detectAgentBackends } from "./agent-cli";
import {
  readAutopilotSettings,
  runAutopilotTick,
  writeAutopilotSettings,
} from "./autopilot-service";

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

export function registerAutopilotIpc(): void {
  ipcMain.handle(IpcChannels.autopilotGet, (_event, raw: unknown) => {
    const { workspaceId: requested } = autopilotGetPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(requested);
    const settings = readAutopilotSettings(workspaceId);
    return autopilotGetResult.parse({
      workspaceId,
      ...settings,
      agentCliMissing: !anyAgentBackendAvailable(detectAgentBackends()),
    });
  });

  ipcMain.handle(IpcChannels.autopilotSet, async (_event, raw: unknown) => {
    const payload = autopilotSetPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const settings = writeAutopilotSettings(workspaceId, {
      enabled: payload.enabled,
      globallyPaused: payload.globallyPaused,
      maxParallel: payload.maxParallel,
      pickupLabels: payload.pickupLabels,
    });
    if (settings.enabled) {
      void runAutopilotTick(workspaceId);
    }
    return autopilotSetResult.parse({
      workspaceId,
      ...settings,
      agentCliMissing: !anyAgentBackendAvailable(detectAgentBackends()),
    });
  });
}