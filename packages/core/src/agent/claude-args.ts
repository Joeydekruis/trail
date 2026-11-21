import { randomUUID } from "node:crypto";

export function buildClaudeAgentArgs(input: {
  prompt: string;
  resumeSessionId?: string | null;
  streamJson?: boolean;
}): string[] {
  const prompt = input.prompt.trim();
  const streamJson = input.streamJson !== false;
  const formatArgs = streamJson ? (["--output-format", "stream-json"] as const) : ([] as const);
  if (input.resumeSessionId?.trim()) {
    return [...formatArgs, "--resume", input.resumeSessionId.trim(), "-p", prompt];
  }
  return [...formatArgs, "-p", prompt];
}

export function planAgentSessionRun(
  existingSessionId: string | null,
  options: { followUp: boolean; resetSession?: boolean },
): { agentSessionId: string; resumeSessionId: string | null } {
  if (options.resetSession) {
    return { agentSessionId: randomUUID(), resumeSessionId: null };
  }
  if (options.followUp && existingSessionId) {
    return { agentSessionId: existingSessionId, resumeSessionId: existingSessionId };
  }
  if (existingSessionId) {
    return { agentSessionId: existingSessionId, resumeSessionId: null };
  }
  return { agentSessionId: randomUUID(), resumeSessionId: null };
}