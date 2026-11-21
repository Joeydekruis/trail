import type { TrailMcpStores } from "./read-api.js";

export type McpResolvePinInput = {
  workspaceId?: string;
  pinId?: number;
  issueNumber?: number;
  pinNumber?: number;
};

export type McpResolvePinResult =
  | {
      ok: true;
      pinId: number;
      issueNumber: number;
      pinNumber: number;
      comment: string;
    }
  | { ok: false; code: "validation" | "not_found"; message: string };

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  if (workspaceId?.trim()) {
    return workspaceId.trim();
  }
  return stores.workspaces.getActiveId();
}

export function mcpResolvePin(
  stores: TrailMcpStores,
  input: McpResolvePinInput,
): McpResolvePinResult {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const hasPinId = input.pinId != null;
  const hasPair = input.issueNumber != null && input.pinNumber != null;
  if (!hasPinId && !hasPair) {
    return {
      ok: false,
      code: "validation",
      message: "pinId or issueNumber+pinNumber is required",
    };
  }
  const removed = stores.pins.resolve({
    workspaceId,
    pinId: input.pinId,
    issueNumber: input.issueNumber,
    pinNumber: input.pinNumber,
  });
  if (!removed) {
    return { ok: false, code: "not_found", message: "Pin not found" };
  }
  return {
    ok: true,
    pinId: removed.id,
    issueNumber: removed.issueNumber,
    pinNumber: removed.pinNumber,
    comment: removed.comment,
  };
}