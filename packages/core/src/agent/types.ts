export const AGENT_BACKEND_IDS = ["cursor", "claude"] as const;

export type AgentBackendId = (typeof AGENT_BACKEND_IDS)[number];

export type AgentBackendStatus = {
  id: AgentBackendId;
  binary: string;
  found: boolean;
  version: string | null;
};