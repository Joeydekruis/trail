import {
  BOARD_COLUMN_ORDER,
  type BoardColumnId,
} from "../issues/columns.js";
import { boardColumnFromProjectStatus } from "../issues/project-status.js";
import type { TrailMcpStores } from "./read-api.js";
import { mcpGetTask } from "./read-api.js";

export type McpUpdateTaskStatusInput = {
  workspaceId?: string;
  number?: number;
  id?: string;
  boardColumn?: string;
  status?: string;
};

export type McpUpdateTaskStatusResult =
  | {
      ok: true;
      workspaceId: string;
      issueNumber: number;
      boardColumn: BoardColumnId;
      title: string;
      state: string;
    }
  | { ok: false; code: "validation" | "not_found"; message: string };

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  if (workspaceId?.trim()) {
    return workspaceId.trim();
  }
  return stores.workspaces.getActiveId();
}

function normalizeColumnId(value: string): BoardColumnId | null {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  const asId = lower.replace(/\s+/g, "-").replace(/_/g, "-");
  if ((BOARD_COLUMN_ORDER as readonly string[]).includes(asId)) {
    return asId as BoardColumnId;
  }
  return boardColumnFromProjectStatus(trimmed);
}

export function resolveMcpUpdateTaskStatus(
  stores: TrailMcpStores,
  input: McpUpdateTaskStatusInput,
): McpUpdateTaskStatusResult {
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
  const statusRaw = input.boardColumn ?? input.status;
  if (!statusRaw?.trim()) {
    return {
      ok: false,
      code: "validation",
      message: "boardColumn or status is required",
    };
  }
  const boardColumn = normalizeColumnId(statusRaw);
  if (!boardColumn) {
    return {
      ok: false,
      code: "validation",
      message: `Unknown board status: ${statusRaw}`,
    };
  }
  return {
    ok: true,
    workspaceId,
    issueNumber: task.number,
    boardColumn,
    title: task.title,
    state: task.state,
  };
}