import { ipcMain } from "electron";
import {
  IpcChannels,
  decisionAcceptPayload,
  decisionAcceptResult,
  decisionCreatePayload,
  decisionCreateResult,
  decisionExportMarkdownPayload,
  decisionExportMarkdownResult,
  decisionRejectPayload,
  decisionRejectResult,
  decisionGetPayload,
  decisionGetResult,
  decisionListPayload,
  decisionListResult,
} from "@trail/ipc";
import {
  formatDecisionMarkdown,
  formatDecisionsBundleMarkdown,
  mcpCreateDecision,
  releaseDecisionBlock,
  stopDecisionBlockedWorktree,
  syncProposedDecisionBlocks,
} from "@trail/core";
import { runAutopilotTick } from "./autopilot-service";
import {
  getDecisionStore,
  getIssueCacheStore,
  getKnowledgeDocStore,
  getPreviewPinStore,
  getWorktreeStore,
  getWorkspaceStore,
} from "./database";

function mcpStores() {
  return {
    workspaces: getWorkspaceStore(),
    issues: getIssueCacheStore(),
    knowledge: getKnowledgeDocStore(),
    decisions: getDecisionStore(),
    worktrees: getWorktreeStore(),
    pins: getPreviewPinStore(),
  };
}

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

function blockedIssueTitle(workspaceId: string, issueNumber: number | null): string | null {
  if (issueNumber == null) {
    return null;
  }
  const issue = getIssueCacheStore().get(workspaceId, issueNumber);
  return issue?.title ?? null;
}

function toDetailDto(record: {
  adrId: string;
  title: string;
  status: string;
  author: string;
  updatedAt: string;
  blocksIssueNumber: number | null;
  contextMarkdown: string;
  decisionMarkdown: string;
  consequencesMarkdown: string;
}, workspaceId: string) {
  return {
    adrId: record.adrId,
    title: record.title,
    status: record.status,
    author: record.author,
    updatedAt: record.updatedAt,
    blocksIssueNumber: record.blocksIssueNumber,
    contextMarkdown: record.contextMarkdown,
    decisionMarkdown: record.decisionMarkdown,
    consequencesMarkdown: record.consequencesMarkdown,
    blockedIssueTitle: blockedIssueTitle(workspaceId, record.blocksIssueNumber),
  };
}

export function registerDecisionIpc(): void {
  ipcMain.handle(IpcChannels.decisionExportMarkdown, (_event, raw: unknown) => {
    const payload = decisionExportMarkdownPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const store = getDecisionStore();
    if (payload.adrId) {
      const record = store.get(workspaceId, payload.adrId);
      if (!record) {
        return decisionExportMarkdownResult.parse({
          ok: false,
          message: "Decision not found",
        });
      }
      return decisionExportMarkdownResult.parse({
        ok: true,
        filename: `${record.adrId}.md`,
        markdown: formatDecisionMarkdown(record),
      });
    }
    const records = store
      .list(workspaceId)
      .map((row) => store.get(workspaceId, row.adrId))
      .filter((row): row is NonNullable<typeof row> => row != null);
    if (records.length === 0) {
      return decisionExportMarkdownResult.parse({
        ok: false,
        message: "No decisions to export",
      });
    }
    return decisionExportMarkdownResult.parse({
      ok: true,
      filename: `decisions-${workspaceId}.md`,
      markdown: formatDecisionsBundleMarkdown(records),
    });
  });

  ipcMain.handle(IpcChannels.decisionCreate, (_event, raw: unknown) => {
    const payload = decisionCreatePayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const created = mcpCreateDecision(mcpStores(), {
      workspaceId,
      title: payload.title,
      contextMarkdown: payload.contextMarkdown,
      decisionMarkdown: payload.decisionMarkdown,
      consequencesMarkdown: payload.consequencesMarkdown,
      blocksIssueNumber: payload.blocksIssueNumber,
      status: payload.status ?? "proposed",
      author: "You",
    });
    if (!created.ok) {
      return decisionCreateResult.parse({
        ok: false,
        message: created.message,
        code: created.code,
        existingAdrId: created.existingAdrId,
      });
    }
    const record = getDecisionStore().get(workspaceId, created.adrId);
    if (!record) {
      return decisionCreateResult.parse({
        ok: false,
        message: "Decision was created but could not be loaded",
      });
    }
    void runAutopilotTick(workspaceId);
    return decisionCreateResult.parse({
      ok: true,
      decision: toDetailDto(record, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.decisionList, (_event, raw: unknown) => {
    const payload = decisionListPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const decisions = getDecisionStore();
    const worktrees = getWorktreeStore();
    syncProposedDecisionBlocks(workspaceId, decisions, worktrees);
    const rows = decisions.list(workspaceId);
    return decisionListResult.parse({ decisions: rows });
  });

  ipcMain.handle(IpcChannels.decisionGet, (_event, raw: unknown) => {
    const payload = decisionGetPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const record = getDecisionStore().get(workspaceId, payload.adrId);
    if (!record) {
      return decisionGetResult.parse({ ok: false, message: "Decision not found" });
    }
    return decisionGetResult.parse({
      ok: true,
      decision: toDetailDto(record, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.decisionAccept, (_event, raw: unknown) => {
    const payload = decisionAcceptPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const decisions = getDecisionStore();
    const before = decisions.get(workspaceId, payload.adrId);
    const accepted = decisions.accept(workspaceId, payload.adrId);
    if (!accepted) {
      return decisionAcceptResult.parse({
        ok: false,
        message: "Only proposed decisions can be accepted",
      });
    }
    if (before?.blocksIssueNumber != null) {
      releaseDecisionBlock(workspaceId, before.blocksIssueNumber, getWorktreeStore());
    }
    void runAutopilotTick(workspaceId);
    return decisionAcceptResult.parse({
      ok: true,
      decision: toDetailDto(accepted, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.decisionReject, (_event, raw: unknown) => {
    const payload = decisionRejectPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const decisions = getDecisionStore();
    const before = decisions.get(workspaceId, payload.adrId);
    const rejected = decisions.reject(workspaceId, payload.adrId);
    if (!rejected) {
      return decisionRejectResult.parse({
        ok: false,
        message: "Only proposed decisions can be rejected",
      });
    }
    if (before?.blocksIssueNumber != null) {
      stopDecisionBlockedWorktree(workspaceId, before.blocksIssueNumber, getWorktreeStore());
    }
    void runAutopilotTick(workspaceId);
    return decisionRejectResult.parse({
      ok: true,
      decision: toDetailDto(rejected, workspaceId),
    });
  });
}