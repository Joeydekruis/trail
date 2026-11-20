import { getWorktreeStore } from "./database";
import {
  startAgentRunViaUtility,
  stopAgentRunViaUtility,
} from "./agent-runner-bridge";
import type { StartAgentRunResult } from "./agent-run-shared";

export {
  AGENT_OUTPUT_CHANNEL,
  AGENT_RUN_STATE_CHANNEL,
} from "./agent-run-shared";

export type { StartAgentRunResult };

export async function startAgentRun(input: {
  workspaceId: string;
  issueNumber: number;
  prompt?: string;
}): Promise<StartAgentRunResult> {
  const record = getWorktreeStore().get(input.workspaceId, input.issueNumber);
  if (!record) {
    return { ok: false, message: "Worktree not found" };
  }

  const prompt =
    input.prompt?.trim() ||
    `Implement GitHub issue #${input.issueNumber}: ${record.title}`;

  const result = await startAgentRunViaUtility({
    workspaceId: input.workspaceId,
    issueNumber: input.issueNumber,
    cwd: record.path,
    prompt,
  });

  if (result.ok) {
    getWorktreeStore().updateStatus(
      input.workspaceId,
      input.issueNumber,
      "running",
    );
  }

  return result;
}

export function stopAgentRun(workspaceId: string, issueNumber: number): boolean {
  const stopped = stopAgentRunViaUtility(workspaceId, issueNumber);
  if (stopped) {
    getWorktreeStore().updateStatus(workspaceId, issueNumber, "stopped");
  }
  return stopped;
}