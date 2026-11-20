import { spawn, type ChildProcess } from "node:child_process";

type StartMessage = {
  type: "start";
  runId: string;
  workspaceId: string;
  issueNumber: number;
  cwd: string;
  backend: "cursor" | "claude" | null;
  binary: string | null;
  prompt: string;
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

function post(message: OutputMessage | DoneMessage): void {
  const port = process.parentPort;
  if (!port) {
    return;
  }
  port.postMessage(message);
}

function previewScript(prompt: string, binary: string | null): string {
  const lines = binary
    ? [
        `console.log('[trail] ${binary} on PATH — full agent args land in a later batch');`,
        `console.log('[trail] Prompt: ${prompt.replace(/'/g, "\\'").slice(0, 200)}');`,
        "console.log('[trail] Run finished (preview).');",
      ]
    : [
        "console.log('[trail] No agent CLI found on PATH.');",
        "console.log('[trail] Install cursor-agent or claude, then retry.');",
      ];
  return lines.join("\n");
}

function spawnForRun(message: StartMessage): ChildProcess {
  const { backend, binary, prompt, cwd } = message;

  if (backend === "claude" && binary) {
    return spawn(binary, ["-p", prompt], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  const script =
    backend === "cursor" && binary
      ? previewScript(prompt, binary)
      : previewScript(prompt, binary);
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
      post({ type: "output", ...base, stream: "stdout", line: trimmed });
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      post({ type: "output", ...base, stream: "stderr", line: trimmed });
    }
  });

  child.on("close", (code) => {
    active.delete(runId);
    post({ type: "done", ...base, exitCode: code ?? 1 });
  });
}

process.parentPort?.on("message", (event: { data: ParentMessage }) => {
  const message = event.data;
  if (message.type === "stop") {
    const child = active.get(message.runId);
    if (child) {
      child.kill("SIGTERM");
      active.delete(message.runId);
    }
    return;
  }

  if (message.type !== "start") {
    return;
  }

  const child = spawnForRun(message);
  active.set(message.runId, child);
  attach(message.runId, message, child);
});