import { spawnSync } from "node:child_process";
import {
  AGENT_BACKEND_IDS,
  parseAgentVersionOutput,
  type AgentBackendId,
  type AgentBackendStatus,
} from "@trail/core";

const BACKEND_BINARIES: Record<AgentBackendId, string> = {
  cursor: "cursor-agent",
  claude: "claude",
};

export function detectAgentBackends(): AgentBackendStatus[] {
  return AGENT_BACKEND_IDS.map((id) => detectOne(id));
}

function detectOne(id: AgentBackendId): AgentBackendStatus {
  const binary = BACKEND_BINARIES[id];
  const result = spawnSync(binary, ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  if (result.error || result.status !== 0) {
    return { id, binary, found: false, version: null };
  }
  const combined = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return {
    id,
    binary,
    found: true,
    version: parseAgentVersionOutput(combined),
  };
}