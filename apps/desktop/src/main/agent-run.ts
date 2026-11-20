import { spawn, type ChildProcess } from "node:child_process";
import { BrowserWindow } from "electron";
import { getWorktreeStore, getWorkspaceStore } from "./database";
import { detectAgentBackends } from "./agent-cli";

export const AGENT_OUTPUT_CHANNEL = "trail.agentOutput" as const;
export const AGENT_RUN_STATE_CHANNEL = "trail.agentRunState" as const;

type RunKey = string;

const activeRuns = new Map<RunKey, ChildProcess>();

function runKey(workspaceId: string, issueNumber: number): RunKey {
  return `${workspaceId}:${issueNumber}`;
}

function broadcast(payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(AGENT_OUTPUT_CHANNEL, payload);
  }
}

function broadcastState(payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(AGENT_RUN_STATE_CHANNEL, payload);
  }
}

export type StartAgentRunResult =
  | { ok: true }
  | { ok: false; message: string };

export function startAgentRun(input: {
  workspaceId: string;
  issueNumber: number;
  prompt?: string;
}): StartAgentRunResult {
  const key = runKey(input.workspaceId, input.issueNumber);
  if (activeRuns.has(key)) {
    return { ok: false, message: "An agent run is already active for this worktree" };
  }

  const record = getWorktreeStore().get(input.workspaceId, input.issueNumber);
  if (!record) {
    return { ok: false, message: "Worktree not found" };
  }

  const backends = detectAgentBackends();
  const cursor = backends.find((b) => b.id === "cursor" && b.found);
  const claude = backends.find((b) => b.id === "claude" && b.found);
  const preferred = cursor ?? claude;

  const workspace = getWorkspaceStore()
    .list()
    .find((ws) => ws.id === input.workspaceId);
  const prompt =
    input.prompt?.trim() ||
    `Implement GitHub issue #${input.issueNumber}: ${record.title}`;

  const script = preferred
    ? [
        `console.log('[trail] Starting ${preferred.binary} preview run');`,
        `console.log('[trail] Worktree: ${record.path}');`,
        `console.log('[trail] Branch: ${record.branch}');`,
        `console.log('[trail] Prompt: ${prompt.replace(/'/g, "\\'")}');`,
        `console.log('[trail] Install ${preferred.binary} on PATH to run the real CLI in a later batch.');`,
        `console.log('[trail] Run finished (preview).');`,
      ].join("\n")
    : [
        "console.log('[trail] No agent CLI found on PATH.');",
        "console.log('[trail] Install cursor-agent or claude, then retry.');",
      ].join("\n");

  const child = spawn(process.execPath, ["-e", script], {
    cwd: record.path,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  activeRuns.set(key, child);

  const base = {
    workspaceId: input.workspaceId,
    issueNumber: input.issueNumber,
    backend: preferred?.id ?? null,
  };

  broadcastState({ ...base, state: "running" as const });

  child.stdout?.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      broadcast({ ...base, stream: "stdout", line: trimmed });
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      broadcast({ ...base, stream: "stderr", line: trimmed });
    }
  });

  child.on("close", (code) => {
    activeRuns.delete(key);
    getWorktreeStore().updateStatus(
      input.workspaceId,
      input.issueNumber,
      "stopped",
    );
    broadcastState({
      ...base,
      state: "stopped" as const,
      exitCode: code ?? 1,
    });
  });

  return { ok: true };
}

export function stopAgentRun(workspaceId: string, issueNumber: number): boolean {
  const child = activeRuns.get(runKey(workspaceId, issueNumber));
  if (!child) {
    return false;
  }
  child.kill("SIGTERM");
  activeRuns.delete(runKey(workspaceId, issueNumber));
  return true;
}