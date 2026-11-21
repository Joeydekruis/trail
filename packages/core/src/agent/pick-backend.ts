import type { AgentBackendId, AgentBackendStatus } from "./types.js";

export const AGENT_CLI_MISSING_MESSAGE =
  "No coding agent CLI found — install Cursor CLI (cursor-agent) or Claude Code (claude)" as const;

export function anyAgentBackendAvailable(backends: AgentBackendStatus[]): boolean {
  return backends.some((backend) => backend.found);
}

export function pickPreferredAgentBackend(
  backends: AgentBackendStatus[],
): AgentBackendStatus | null {
  const byId = (id: AgentBackendId) => backends.find((row) => row.id === id && row.found);
  return byId("claude") ?? byId("cursor") ?? null;
}