import { ipcMain } from "electron";
import {
  readMcpWorkspaceSettings,
  writeMcpWorkspaceSettings,
} from "@trail/core";
import {
  IpcChannels,
  mcpConnectionResult,
  mcpSettingsGetPayload,
  mcpSettingsGetResult,
  mcpSettingsSetPayload,
  mcpSettingsSetResult,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";
import { resolveMcpConnectionFile, TRAIL_MCP_STREAMABLE_PATH } from "@trail/mcp";
import { getMcpConnectionSnapshot } from "./mcp-server";

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

export function registerMcpIpc(): void {
  ipcMain.handle(IpcChannels.mcpSettingsGet, (_event, raw: unknown) => {
    const payload = mcpSettingsGetPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    return mcpSettingsGetResult.parse(readMcpWorkspaceSettings(getWorkspaceStore(), workspaceId));
  });

  ipcMain.handle(IpcChannels.mcpSettingsSet, (_event, raw: unknown) => {
    const payload = mcpSettingsSetPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const saved = writeMcpWorkspaceSettings(getWorkspaceStore(), workspaceId, {
      enabled: payload.enabled,
      readEnabled: payload.readEnabled,
      writeEnabled: payload.writeEnabled,
      sourceDocs: payload.sourceDocs,
      sourceDecisions: payload.sourceDecisions,
      sourceDesigns: payload.sourceDesigns,
      allowAgentRuns: payload.allowAgentRuns,
    });
    return mcpSettingsSetResult.parse(saved);
  });

  ipcMain.handle(IpcChannels.mcpConnection, () => {
    const snap = getMcpConnectionSnapshot();
    const connectionFile = snap.connectionFile || resolveMcpConnectionFile();
    const stdioCommand = "npx trail-mcp";
    const streamableUrl =
      snap.baseUrl != null
        ? `${snap.baseUrl}${TRAIL_MCP_STREAMABLE_PATH}`
        : null;
    const cursorConfigJson = JSON.stringify(
      {
        mcpServers: {
          trail: {
            command: "npx",
            args: ["trail-mcp"],
          },
          ...(streamableUrl && snap.token
            ? {
                "trail-streamable-http": {
                  url: streamableUrl,
                  headers: {
                    Authorization: `Bearer ${snap.token}`,
                  },
                },
              }
            : {}),
        },
      },
      null,
      2,
    );
    return mcpConnectionResult.parse({
      ...snap,
      streamableUrl,
      connectionFile,
      stdioCommand,
      cursorConfigJson,
    });
  });
}