import { ipcMain } from "electron";
import {
  IpcChannels,
  decisionAcceptPayload,
  decisionAcceptResult,
  decisionGetPayload,
  decisionGetResult,
  decisionListPayload,
  decisionListResult,
} from "@trail/ipc";
import { releaseDecisionBlock, syncProposedDecisionBlocks } from "@trail/core";
import { runAutopilotTick } from "./autopilot-service";
import {
  getDecisionStore,
  getIssueCacheStore,
  getWorktreeStore,
  getWorkspaceStore,
} from "./database";

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
}