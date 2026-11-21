import {
  AGENT_PARALLEL_LIMIT_MESSAGE,
  canStartAnotherAgentRun,
  resolveAutopilotMaxParallel,
  workspaceAutopilotMaxParallelKey,
} from "@trail/core";
import { countActiveAgentRuns } from "./agent-runner-bridge";
import { startAgentRun } from "./agent-run";
import { getWorktreeStore, getWorkspaceStore } from "./database";

function maxParallelForWorkspace(workspaceId: string): number {
  return resolveAutopilotMaxParallel(
    getWorkspaceStore().getAppSetting(workspaceAutopilotMaxParallelKey(workspaceId)),
  );
}

export async function drainQueuedAgentRuns(): Promise<void> {
  const worktreeStore = getWorktreeStore();
  const workspaceStore = getWorkspaceStore();
  const queued = workspaceStore
    .list()
    .flatMap((workspace) =>
      worktreeStore
        .listByWorkspace(workspace.id)
        .filter((row) => row.status === "queued")
        .map((record) => ({ workspaceId: workspace.id, record })),
    )
    .sort((a, b) => a.record.createdAt.localeCompare(b.record.createdAt));

  for (const { workspaceId, record } of queued) {
    const maxParallel = maxParallelForWorkspace(workspaceId);
    if (!canStartAnotherAgentRun(countActiveAgentRuns(), maxParallel)) {
      break;
    }
    const started = await startAgentRun({
      workspaceId,
      issueNumber: record.issueNumber,
      followUp: Boolean(record.agentSessionId),
    });
    if (!started.ok && started.message === AGENT_PARALLEL_LIMIT_MESSAGE) {
      break;
    }
    if (!started.ok) {
      worktreeStore.updateStatus(workspaceId, record.issueNumber, "failed");
    }
  }
}