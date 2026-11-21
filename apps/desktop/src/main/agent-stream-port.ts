import { BrowserWindow, MessageChannelMain } from "electron";

export const AGENT_STREAM_MESSAGE_CHANNEL = "trail-agent-stream" as const;

export function createAgentStreamChannel(): MessageChannelMain {
  return new MessageChannelMain();
}

export function deliverAgentStreamPort(
  workspaceId: string,
  issueNumber: number,
  runId: string,
  port: import("electron").MessagePortMain,
): void {
  const payload = {
    channel: AGENT_STREAM_MESSAGE_CHANNEL,
    workspaceId,
    issueNumber,
    runId,
  };
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.webContents.isDestroyed()) {
      continue;
    }
    win.webContents.postMessage(AGENT_STREAM_MESSAGE_CHANNEL, payload, [port]);
  }
}