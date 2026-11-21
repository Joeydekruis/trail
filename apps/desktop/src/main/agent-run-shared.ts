import { BrowserWindow } from "electron";

export const AGENT_OUTPUT_CHANNEL = "trail.agentOutput" as const;
export const AGENT_RUN_STATE_CHANNEL = "trail.agentRunState" as const;

export type StartAgentRunInput = {
  workspaceId: string;
  issueNumber: number;
  cwd: string;
  prompt: string;
  resumeSessionId?: string | null;
};

export type StartAgentRunResult =
  | { ok: true }
  | { ok: false; message: string };

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

export function broadcastAgentOutput(payload: {
  workspaceId: string;
  issueNumber: number;
  stream: "stdout" | "stderr";
  line: string;
  backend: "cursor" | "claude" | null;
}): void {
  broadcast(AGENT_OUTPUT_CHANNEL, payload);
}

export function broadcastAgentRunState(payload: {
  workspaceId: string;
  issueNumber: number;
  state: "running" | "stopped";
  backend: "cursor" | "claude" | null;
  exitCode?: number;
  durationMs?: number;
}): void {
  broadcast(AGENT_RUN_STATE_CHANNEL, payload);
}