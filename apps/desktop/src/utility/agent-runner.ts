import { spawn, type ChildProcess } from "node:child_process";
import type { MessagePortMain } from "electron";
import { buildClaudeAgentArgs } from "@trail/core";

type StartMessage = {
  type: "start";
  runId: string;
  workspaceId: string;
  issueNumber: number;
  cwd: string;
  backend: "cursor" | "claude" | null;
  binary: string | null;
  prompt: string;
  resumeSessionId?: string | null;
};

type StopMessage = {
  type: "stop";
  runId: string;
};

type ParentMessage = StartMessage | StopMessage;

type OutputMessage = {
  type: "output";
  runId: string;
  workspaceId: string;
  issueNumber: number;
  stream: "stdout" | "stderr";
  line: string;
  backend: "cursor" | "claude" | null;
};

type DoneMessage = {
  type: "done";
  runId: string;
  workspaceId: string;
  issueNumber: number;
  exitCode: number;
  backend: "cursor" | "claude" | null;
};

const active = new Map<string, ChildProcess>();
const streamPortByRun = new Map<string, MessagePortMain>();

function postToParent(message: OutputMessage | DoneMessage): void {
  const port = process.parentPort;
  if (!port) {
    return;
  }
  port.postMessage(message);
}

function postOutput(message: OutputMessage): void {
  const streamPort = streamPortByRun.get(message.runId);
  if (streamPort) {
    streamPort.postMessage(message);
    return;
  }
  postToParent(message);
}

function postDone(message: DoneMessage): void {
  const streamPort = streamPortByRun.get(message.runId);
  if (streamPort) {
    streamPort.postMessage(message);
    streamPort.close();
    streamPortByRun.delete(message.runId);
  }
  postToParent(message);
}

function previewScript(prompt: string, binary: string | null, resumeSessionId: string | null): string {
  const lines = binary
    ? [
        `console.log('[trail] ${binary} on PATH — full agent args land in a later batch');`,
        resumeSessionId
          ? `console.log('[trail] Resume session: ${resumeSessionId.replace(/'/g, "\\'")}');`
          : null,
        `console.log('[trail] Prompt: ${prompt.replace(/'/g, "\\'").slice(0, 200)}');`,
        "console.log('[trail] Run finished (preview).');",
      ].filter((line): line is string => Boolean(line))
    : [
        "console.log('[trail] No agent CLI found on PATH.');",
        "console.log('[trail] Install cursor-agent or claude, then retry.');",
      ];
  return lines.join("\n");
}

function spawnForRun(message: StartMessage): ChildProcess {
  const { backend, binary, prompt, cwd, resumeSessionId = null } = message;

  if (backend === "claude" && binary) {
    return spawn(binary, buildClaudeAgentArgs({ prompt, resumeSessionId }), {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  const script =
    backend === "cursor" && binary
      ? previewScript(prompt, binary, resumeSessionId)
      : previewScript(prompt, binary, resumeSessionId);
  return spawn(process.execPath, ["-e", script], {
    cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function attach(runId: string, message: StartMessage, child: ChildProcess): void {
  const base = {
    runId,
    workspaceId: message.workspaceId,
    issueNumber: message.issueNumber,
    backend: message.backend,
  };

  child.stdout?.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      postOutput({ type: "output", ...base, stream: "stdout", line: trimmed });
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      postOutput({ type: "output", ...base, stream: "stderr", line: trimmed });
    }
  });

  child.on("close", (code) => {
    active.delete(runId);
    postDone({ type: "done", ...base, exitCode: code ?? 1 });
  });
}

process.parentPort?.on("message", (event: { data: ParentMessage; ports?: MessagePortMain[] }) => {
  const message = event.data;
  if (message.type === "stop") {
    const child = active.get(message.runId);
    if (child) {
      child.kill("SIGTERM");
      active.delete(message.runId);
    }
    const streamPort = streamPortByRun.get(message.runId);
    streamPort?.close();
    streamPortByRun.delete(message.runId);
    return;
  }

  if (message.type !== "start") {
    return;
  }

  const streamPort = event.ports?.[0];
  if (streamPort) {
    streamPort.start();
    streamPortByRun.set(message.runId, streamPort);
  }

  const child = spawnForRun(message);
  active.set(message.runId, child);
  attach(message.runId, message, child);
});