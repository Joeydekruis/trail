const AGENT_STREAM_MESSAGE_CHANNEL = "trail-agent-stream";

export type AgentStreamOutputPayload = {
  workspaceId: string;
  issueNumber: number;
  stream: "stdout" | "stderr";
  line: string;
  backend: "cursor" | "claude" | null;
};

type AgentStreamOutputListener = (payload: AgentStreamOutputPayload) => void;

const outputListeners = new Set<AgentStreamOutputListener>();
const activePorts = new Map<string, MessagePort>();

function runKey(workspaceId: string, issueNumber: number): string {
  return `${workspaceId}:${issueNumber}`;
}

export function registerAgentStreamBridge(): void {
  window.addEventListener("message", (event) => {
    if (event.source !== window) {
      return;
    }
    const data = event.data as { channel?: string; workspaceId?: string; issueNumber?: number } | null;
    if (!data || data.channel !== AGENT_STREAM_MESSAGE_CHANNEL) {
      return;
    }
    if (!data.workspaceId || typeof data.issueNumber !== "number") {
      return;
    }
    const port = event.ports[0];
    if (!port) {
      return;
    }
    const key = runKey(data.workspaceId, data.issueNumber);
    const existing = activePorts.get(key);
    existing?.close();
    activePorts.set(key, port);
    port.start();
    port.onmessage = (ev: MessageEvent) => {
      const payload = ev.data as {
        type?: string;
        workspaceId?: string;
        issueNumber?: number;
        stream?: "stdout" | "stderr";
        line?: string;
        backend?: "cursor" | "claude" | null;
      };
      if (!payload || typeof payload !== "object") {
        return;
      }
      if (
        payload.type === "output" &&
        payload.workspaceId &&
        typeof payload.issueNumber === "number" &&
        payload.line
      ) {
        const message: AgentStreamOutputPayload = {
          workspaceId: payload.workspaceId,
          issueNumber: payload.issueNumber,
          stream: payload.stream ?? "stdout",
          line: payload.line,
          backend: payload.backend ?? null,
        };
        for (const listener of outputListeners) {
          listener(message);
        }
      }
      if (payload.type === "done") {
        port.close();
        activePorts.delete(key);
      }
    };
  });
}

export function onAgentStreamOutput(listener: AgentStreamOutputListener): () => void {
  outputListeners.add(listener);
  return () => outputListeners.delete(listener);
}