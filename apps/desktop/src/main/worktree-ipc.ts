import { BrowserWindow, dialog, ipcMain } from "electron";
import type { WorktreeDto } from "@trail/ipc";
import {
  IpcChannels,
  worktreeCreatePayload,
  worktreeCreateResult,
  worktreeListPayload,
  worktreeListResult,
  worktreeSetStatusPayload,
  worktreeSetStatusResult,
  worktreeResolvePullRequestPayload,
  worktreeResolvePullRequestResult,
  workspaceRepoRootGetPayload,
  workspaceRepoRootGetResult,
  workspaceRepoRootPickResult,
  workspaceRepoRootSetPayload,
  workspaceRepoRootSetResult,
} from "@trail/ipc";
import type { WorktreeRecord } from "@trail/core";
import { getIssueCacheStore, getWorktreeStore, getWorkspaceStore } from "./database";
import { isGitRepository } from "./git-exec";
import { createLocalWorktree } from "./worktree-create";
import { resolveWorktreePullRequestUrl } from "./worktree-resolve-pull-request";
import {
  readWorkspaceRepoRoot,
  readWorkspaceWorktreeRoot,
  writeWorkspaceRepoRoot,
  writeWorkspaceWorktreeRoot,
} from "./worktree-paths";

function toDto(record: WorktreeRecord): WorktreeDto {
  return {
    id: record.id,
    issueNumber: record.issueNumber,
    title: record.title,
    branch: record.branch,
    path: record.path,
    status: record.status,
    isRemote: record.isRemote,
    createdAt: record.createdAt,
    pullRequestUrl: record.pullRequestUrl,
    agentSessionId: record.agentSessionId,
  };
}

function resolveWorkspaceId(explicit?: string): string {
  const store = getWorkspaceStore();
  return explicit ?? store.getActiveId();
}

export function registerWorktreeIpc(): void {
  ipcMain.handle(IpcChannels.worktreeList, (_event, raw: unknown) => {
    const { workspaceId: requested } = worktreeListPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(requested);
    const worktrees = getWorktreeStore()
      .listByWorkspace(workspaceId)
      .map(toDto);
    const workspaceStore = getWorkspaceStore();
    return worktreeListResult.parse({
      worktrees,
      repoRoot: readWorkspaceRepoRoot(workspaceStore, workspaceId),
      worktreeRoot: readWorkspaceWorktreeRoot(workspaceStore, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.worktreeResolvePullRequest, async (_event, raw: unknown) => {
    const payload = worktreeResolvePullRequestPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const result = await resolveWorktreePullRequestUrl(workspaceId, payload.issueNumber);
    return worktreeResolvePullRequestResult.parse(result);
  });

  ipcMain.handle(IpcChannels.worktreeSetStatus, (_event, raw: unknown) => {
    const payload = worktreeSetStatusPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const store = getWorktreeStore();
    const updated = store.updateStatus(
      workspaceId,
      payload.issueNumber,
      payload.status,
    );
    if (!updated) {
      return worktreeSetStatusResult.parse({
        ok: false,
        message: "Worktree not found",
      });
    }
    return worktreeSetStatusResult.parse({
      ok: true,
      worktree: toDto(updated),
    });
  });

  ipcMain.handle(IpcChannels.worktreeCreate, (_event, raw: unknown) => {
    const payload = worktreeCreatePayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const result = createLocalWorktree({
      workspaceStore: getWorkspaceStore(),
      worktreeStore: getWorktreeStore(),
      issueStore: getIssueCacheStore(),
      workspaceId,
      issueNumber: payload.issueNumber,
      title: payload.title,
    });
    if (!result.ok) {
      return worktreeCreateResult.parse({ ok: false, message: result.message });
    }
    return worktreeCreateResult.parse({
      ok: true,
      worktree: toDto(result.record),
    });
  });

  ipcMain.handle(IpcChannels.workspaceRepoRootGet, (_event, raw: unknown) => {
    const { workspaceId: requested } = workspaceRepoRootGetPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(requested);
    const workspaceStore = getWorkspaceStore();
    return workspaceRepoRootGetResult.parse({
      repoRoot: readWorkspaceRepoRoot(workspaceStore, workspaceId),
      worktreeRoot: readWorkspaceWorktreeRoot(workspaceStore, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.workspaceRepoRootSet, (_event, raw: unknown) => {
    const payload = workspaceRepoRootSetPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const workspaceStore = getWorkspaceStore();
    if (payload.repoRoot?.trim()) {
      const trimmed = payload.repoRoot.trim();
      if (!isGitRepository(trimmed)) {
        return workspaceRepoRootSetResult.parse({
          repoRoot: readWorkspaceRepoRoot(workspaceStore, workspaceId),
          worktreeRoot: readWorkspaceWorktreeRoot(workspaceStore, workspaceId),
          message: "That folder is not a git repository",
        });
      }
      writeWorkspaceRepoRoot(workspaceStore, workspaceId, trimmed);
    } else if (payload.repoRoot === null) {
      writeWorkspaceRepoRoot(workspaceStore, workspaceId, null);
    }
    if (payload.worktreeRoot?.trim()) {
      writeWorkspaceWorktreeRoot(workspaceStore, workspaceId, payload.worktreeRoot.trim());
    }
    return workspaceRepoRootSetResult.parse({
      repoRoot: readWorkspaceRepoRoot(workspaceStore, workspaceId),
      worktreeRoot: readWorkspaceWorktreeRoot(workspaceStore, workspaceId),
    });
  });

  ipcMain.handle(IpcChannels.workspaceRepoRootPick, async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    const options = {
      properties: ["openDirectory" as const],
      title: "Choose local git repository",
    };
    const picked = browserWindow
      ? await dialog.showOpenDialog(browserWindow, options)
      : await dialog.showOpenDialog(options);
    if (picked.canceled || picked.filePaths.length === 0) {
      return workspaceRepoRootPickResult.parse({ ok: false, cancelled: true });
    }
    const path = picked.filePaths[0];
    if (!isGitRepository(path)) {
      return workspaceRepoRootPickResult.parse({
        ok: false,
        message: "That folder is not a git repository",
      });
    }
    return workspaceRepoRootPickResult.parse({ ok: true, path });
  });
}