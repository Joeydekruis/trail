import { utilityProcess, type UtilityProcess } from "electron";
import { AGENT_CLI_MISSING_MESSAGE, pickPreferredAgentBackend } from "@trail/core";
import { detectAgentBackends } from "./agent-cli";
import { resolveAgentRunnerUtilityPath } from "./agent-runner-path";
import { createAgentStreamChannel, deliverAgentStreamPort } from "./agent-stream-port";
import { finalizeAgentRun } from "./agent-draft-pr";
import {
  broadcastAgentRunState,
  type StartAgentRunInput,
  type StartAgentRunResult,
} from "./agent-run-shared";

type RunKey = string;

let utility: UtilityProcess | null = null;
let utilityReady = false;
const pendingStarts: Array<{ input: StartAgentRunInput; resolve: (r: StartAgentRunResult) => void }> =
  [];
const runIdByKey = new Map<RunKey, string>();
const keyByRunId = new Map<string, RunKey>();
const runStartedAtMs = new Map<RunKey, number>();

function runKey(workspaceId: string, issueNumber: number): RunKey {
  return `${workspaceId}:${issueNumber}`;
}

function ensureUtility(): UtilityProcess | null {
  if (utility) {
    return utility;
  }
  try {
    const entry = resolveAgentRunnerUtilityPath();
    utility = utilityProcess.fork(entry, [], {
      serviceName: "trail-agent-runner",
      stdio: "pipe",
    });
    utility.on("message", (message: unknown) => {
      handleUtilityMessage(message);
    });
    utility.on("exit", () => {
      utility = null;
      utilityReady = false;
    });
    utility.on("spawn", () => {
      utilityReady = true;
      flushPendingStarts();
    });
    return utility;
  } catch (error) {
    console.warn("[trail] agent utility process failed to start:", error);
    return null;
  }
}

function flushPendingStarts(): void {
  const proc = utility;
  if (!proc || !utilityReady) {
    return;
  }
  const queue = pendingStarts.splice(0, pendingStarts.length);
  for (const item of queue) {
    startOnUtility(proc, item.input, item.resolve);
  }
}

function handleUtilityMessage(message: unknown): void {
  if (!message || typeof message !== "object" || !("type" in message)) {
    return;
  }
  const typed = message as
    | {
        type: "output";
        runId: string;
        workspaceId: string;
        issueNumber: number;
        stream: "stdout" | "stderr";
        line: string;
        backend: "cursor" | "claude" | null;
      }
    | {
        type: "done";
        runId: string;
        workspaceId: string;
        issueNumber: number;
        exitCode: number;
        backend: "cursor" | "claude" | null;
      };

  if (typed.type === "output") {
    return;
  }

  if (typed.type === "done") {
    const key = keyByRunId.get(typed.runId);
    if (key) {
      runIdByKey.delete(key);
      keyByRunId.delete(typed.runId);
    }
    const durationKey = runKey(typed.workspaceId, typed.issueNumber);
    const startedAt = runStartedAtMs.get(durationKey);
    runStartedAtMs.delete(durationKey);
    const durationMs =
      startedAt !== undefined ? Math.max(0, Date.now() - startedAt) : undefined;

    void finalizeAgentRun(
      typed.workspaceId,
      typed.issueNumber,
      typed.exitCode,
    ).finally(() => {
      broadcastAgentRunState({
        workspaceId: typed.workspaceId,
        issueNumber: typed.issueNumber,
        state: "stopped",
        backend: typed.backend,
        exitCode: typed.exitCode,
        durationMs,
      });
      void import("./auto-updater.js").then((mod) => mod.tryInstallDownloadedUpdate());
      void import("./agent-run-queue.js").then((mod) => mod.drainQueuedAgentRuns());
    });
  }
}

function startOnUtility(
  proc: UtilityProcess,
  input: StartAgentRunInput,
  resolve: (r: StartAgentRunResult) => void,
): void {
  const key = runKey(input.workspaceId, input.issueNumber);
  if (runIdByKey.has(key)) {
    resolve({ ok: false, message: "An agent run is already active for this worktree" });
    return;
  }

  const preferred = pickPreferredAgentBackend(detectAgentBackends());
  if (!preferred) {
    resolve({ ok: false, message: AGENT_CLI_MISSING_MESSAGE });
    return;
  }

  const runId = `${key}:${Date.now()}`;
  runIdByKey.set(key, runId);
  keyByRunId.set(runId, key);

  runStartedAtMs.set(key, Date.now());

  broadcastAgentRunState({
    workspaceId: input.workspaceId,
    issueNumber: input.issueNumber,
    state: "running",
    backend: preferred.id,
  });

  const streamChannel = createAgentStreamChannel();
  deliverAgentStreamPort(input.workspaceId, input.issueNumber, runId, streamChannel.port2);

  proc.postMessage(
    {
      type: "start",
      runId,
      workspaceId: input.workspaceId,
      issueNumber: input.issueNumber,
      cwd: input.cwd,
      backend: preferred.id,
      binary: preferred.binary,
      prompt: input.prompt,
      resumeSessionId: input.resumeSessionId ?? null,
    },
    [streamChannel.port1],
  );

  resolve({ ok: true });
}

export function startAgentRunViaUtility(
  input: StartAgentRunInput,
): Promise<StartAgentRunResult> {
  return new Promise((resolve) => {
    const proc = ensureUtility();
    if (!proc) {
      resolve({ ok: false, message: "Agent runner utility failed to start" });
      return;
    }
    if (!utilityReady) {
      pendingStarts.push({ input, resolve });
      return;
    }
    startOnUtility(proc, input, resolve);
  });
}

export function countActiveAgentRuns(): number {
  return runIdByKey.size;
}

export function stopAgentRunViaUtility(workspaceId: string, issueNumber: number): boolean {
  const key = runKey(workspaceId, issueNumber);
  const runId = runIdByKey.get(key);
  if (!runId || !utility) {
    return false;
  }
  utility.postMessage({ type: "stop", runId });
  runIdByKey.delete(key);
  keyByRunId.delete(runId);
  runStartedAtMs.delete(key);
  void import("./auto-updater.js").then((mod) => mod.tryInstallDownloadedUpdate());
  void import("./agent-run-queue.js").then((mod) => mod.drainQueuedAgentRuns());
  return true;
}