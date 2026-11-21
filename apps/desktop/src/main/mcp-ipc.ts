import { ipcMain } from "electron";
import { IpcChannels, mcpConnectionResult } from "@trail/ipc";
import { resolveMcpConnectionFile } from "@trail/mcp";
import { getMcpConnectionSnapshot } from "./mcp-server";

export function registerMcpIpc(): void {
  ipcMain.handle(IpcChannels.mcpConnection, () => {
    const snap = getMcpConnectionSnapshot();
    const connectionFile = snap.connectionFile || resolveMcpConnectionFile();
    const stdioCommand = "npx trail-mcp";
    const cursorConfigJson = JSON.stringify(
      {
        mcpServers: {
          trail: {
            command: "npx",
            args: ["trail-mcp"],
          },
        },
      },
      null,
      2,
    );
    return mcpConnectionResult.parse({
      ...snap,
      connectionFile,
      stdioCommand,
      cursorConfigJson,
    });
  });
}