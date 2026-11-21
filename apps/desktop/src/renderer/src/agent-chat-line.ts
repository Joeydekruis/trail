import type { ChatLine } from "./design/worktree-fixture";

export type AgentOutputPayload = {
  workspaceId: string;
  issueNumber: number;
  stream: "stdout" | "stderr";
  line: string;
  backend: "cursor" | "claude" | null;
};

export function agentOutputToChatLine(payload: AgentOutputPayload): ChatLine {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return {
    who: payload.backend === "claude" ? "Claude" : "Agent",
    initials: payload.backend === "claude" ? "CL" : "CU",
    tone: "blue",
    time,
    body: payload.line,
    ...(payload.stream === "stderr"
      ? { chip: { text: "stderr", tone: "gray" as const } }
      : {}),
  };
}