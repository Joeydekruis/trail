import type { TrailMcpStores } from "./read-api.js";
import { mcpGetTask } from "./read-api.js";

export type McpStartAgentRunInput = {
  workspaceId?: string;
  number?: number;
  id?: string;
  prompt?: string;
};

export type McpStartAgentRunResult =
  | {
      ok: true;
      workspaceId: string;
      issueNumber: number;
      title: string;
      cwd: string;
      prompt: string;
    }
  | { ok: false; code: "validation" | "not_found" | "busy"; message: string };

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  if (workspaceId?.trim()) {
    return workspaceId.trim();
  }
  return stores.workspaces.getActiveId();
}

export function resolveMcpStartAgentRun(
  stores: TrailMcpStores,
  input: McpStartAgentRunInput,
): McpStartAgentRunResult {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const task = mcpGetTask(stores, {
    workspaceId,
    number: input.number,
    id: input.id,
  });
  if (!task) {
    return {
      ok: false,
      code: "not_found",
      message: "Task not found in workspace cache — sync first",
    };
  }
  const worktree = stores.worktrees.get(workspaceId, task.number);
  if (!worktree) {
    return {
      ok: false,
      code: "not_found",
      message: "No local worktree for this issue — create a worktree in Trail first",
    };
  }
  if (worktree.status === "running") {
    return {
      ok: false,
      code: "busy",
      message: "An agent run is already active for this worktree",
    };
  }
  const prompt =
    input.prompt?.trim() ||
    `Implement GitHub issue #${task.number}: ${task.title}`;
  return {
    ok: true,
    workspaceId,
    issueNumber: task.number,
    title: task.title,
    cwd: worktree.path,
    prompt,
  };
}