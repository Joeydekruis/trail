import type { TrailMcpStores } from "./read-api.js";
import { mcpGetTask } from "./read-api.js";

export type McpAddTaskCommentInput = {
  workspaceId?: string;
  number?: number;
  id?: string;
  body: string;
};

export type McpAddTaskCommentResult =
  | { ok: true; workspaceId: string; issueNumber: number; title: string }
  | { ok: false; code: "validation" | "not_found"; message: string };

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  if (workspaceId?.trim()) {
    return workspaceId.trim();
  }
  return stores.workspaces.getActiveId();
}

export function resolveMcpAddTaskComment(
  stores: TrailMcpStores,
  input: McpAddTaskCommentInput,
): McpAddTaskCommentResult {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const body = input.body.trim();
  if (!body) {
    return { ok: false, code: "validation", message: "body is required" };
  }
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
  return {
    ok: true,
    workspaceId,
    issueNumber: task.number,
    title: task.title,
  };
}