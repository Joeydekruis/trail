import { allocateNextAdrId, decisionRecordId } from "../decisions/adr-id.js";
import type { DecisionStore } from "../decisions/store.js";
import { syncProposedDecisionBlocks } from "../decisions/sync-blocks.js";
import type { DecisionStatus, DecisionSummary } from "../decisions/types.js";
import type { TrailMcpStores } from "./read-api.js";

export type McpCreateDecisionInput = {
  workspaceId?: string;
  adrId?: string;
  title: string;
  contextMarkdown: string;
  decisionMarkdown: string;
  consequencesMarkdown?: string;
  status?: DecisionStatus;
  blocksIssueNumber?: number;
  author?: string;
  allowSimilarTitle?: boolean;
};

export type McpCreateDecisionResult =
  | {
      ok: true;
      adrId: string;
      title: string;
      status: DecisionStatus;
      blocksIssueNumber: number | null;
    }
  | {
      ok: false;
      code: "conflict" | "validation";
      message: string;
      existingAdrId?: string;
    };

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  if (workspaceId?.trim()) {
    return workspaceId.trim();
  }
  return stores.workspaces.getActiveId();
}

function findTitleConflict(
  workspaceId: string,
  title: string,
  store: DecisionStore,
): DecisionSummary | null {
  const normalized = title.trim().toLowerCase();
  for (const row of store.list(workspaceId)) {
    if (row.status === "rejected" || row.status === "superseded") {
      continue;
    }
    if (row.title.trim().toLowerCase() === normalized) {
      return row;
    }
  }
  return null;
}

function findDuplicateAdrId(workspaceId: string, adrId: string, store: DecisionStore): boolean {
  return store.get(workspaceId, adrId) != null;
}

export function mcpCreateDecision(
  stores: TrailMcpStores,
  input: McpCreateDecisionInput,
): McpCreateDecisionResult {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const title = input.title.trim();
  if (!title) {
    return { ok: false, code: "validation", message: "title is required" };
  }
  if (!input.contextMarkdown.trim() || !input.decisionMarkdown.trim()) {
    return {
      ok: false,
      code: "validation",
      message: "contextMarkdown and decisionMarkdown are required",
    };
  }

  const status = input.status ?? "proposed";
  if (status !== "proposed" && status !== "accepted") {
    return {
      ok: false,
      code: "validation",
      message: "status must be proposed or accepted for create_decision",
    };
  }

  const adrId =
    input.adrId?.trim() ||
    allocateNextAdrId(workspaceId, stores.decisions);

  if (!/^ADR-\d+$/i.test(adrId)) {
    return {
      ok: false,
      code: "validation",
      message: "adrId must match ADR-NNN",
    };
  }

  if (findDuplicateAdrId(workspaceId, adrId, stores.decisions)) {
    return {
      ok: false,
      code: "conflict",
      message: `Decision ${adrId} already exists`,
      existingAdrId: adrId,
    };
  }

  if (!input.allowSimilarTitle) {
    const conflict = findTitleConflict(workspaceId, title, stores.decisions);
    if (conflict) {
      return {
        ok: false,
        code: "conflict",
        message: `A decision with the same title already exists (${conflict.adrId})`,
        existingAdrId: conflict.adrId,
      };
    }
  }

  const blocksIssueNumber =
    status === "proposed" && input.blocksIssueNumber != null
      ? input.blocksIssueNumber
      : null;

  if (blocksIssueNumber != null) {
    const issue = stores.issues.get(workspaceId, blocksIssueNumber);
    if (!issue) {
      return {
        ok: false,
        code: "validation",
        message: `blocksIssueNumber ${blocksIssueNumber} is not in the issue cache`,
      };
    }
    const otherBlock = stores.decisions
      .listProposedBlocking(workspaceId)
      .find((row) => row.blocksIssueNumber === blocksIssueNumber);
    if (otherBlock) {
      return {
        ok: false,
        code: "conflict",
        message: `Issue #${blocksIssueNumber} is already blocked by ${otherBlock.adrId}`,
        existingAdrId: otherBlock.adrId,
      };
    }
  }

  const now = new Date().toISOString();
  const idMatch = /^ADR-(\d+)$/i.exec(adrId.trim());
  const canonicalAdrId = idMatch
    ? `ADR-${idMatch[1].padStart(3, "0")}`
    : adrId.trim();

  stores.decisions.upsert({
    id: decisionRecordId(workspaceId, canonicalAdrId),
    workspaceId,
    adrId: canonicalAdrId,
    title,
    status,
    contextMarkdown: input.contextMarkdown.trim(),
    decisionMarkdown: input.decisionMarkdown.trim(),
    consequencesMarkdown: input.consequencesMarkdown?.trim() ?? "",
    author: input.author?.trim() || "Agent",
    blocksIssueNumber,
    updatedAt: now,
  });

  if (status === "proposed" && blocksIssueNumber != null) {
    syncProposedDecisionBlocks(workspaceId, stores.decisions, stores.worktrees);
  }

  return {
    ok: true,
    adrId: canonicalAdrId,
    title,
    status,
    blocksIssueNumber,
  };
}