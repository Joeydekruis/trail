import { ipcMain } from "electron";
import { issueRecordToDetail, labelsForNewIssue, mapGitHubIssueComments } from "@trail/core";
import {
  IpcChannels,
  issueCreatePayload,
  issueCreateResult,
  issueGetPayload,
  issueGetResult,
} from "@trail/ipc";
import {
  getIssueCacheStore,
  getIssueSyncConflictStore,
  getWorkspaceStore,
} from "./database";
import { createGitHubIssue, fetchGitHubIssueComments } from "./github-api";
import { readGitHubToken } from "./github-token-store";
import { syncWorkspaceNow } from "./sync-now";

function parseRepository(fullName: string): { owner: string; repo: string } | null {
  const slash = fullName.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return {
    owner: fullName.slice(0, slash),
    repo: fullName.slice(slash + 1),
  };
}

export function registerIssueIpc(): void {
  ipcMain.handle(IpcChannels.issueGet, async (_event, raw: unknown) => {
    const { workspaceId, issueNumber } = issueGetPayload.parse(raw);
    const workspaces = getWorkspaceStore();
    const id = workspaceId ?? workspaces.getActiveId();
    const record = getIssueCacheStore().get(id, issueNumber);
    if (!record) {
      return issueGetResult.parse({ found: false });
    }

    let comments: ReturnType<typeof mapGitHubIssueComments> | undefined;
    const workspace = workspaces.list().find((row) => row.id === id);
    const repository = workspace?.repository ?? null;
    const token = readGitHubToken();

    if (repository && token) {
      const parts = parseRepository(repository);
      if (parts) {
        const result = await fetchGitHubIssueComments(
          token,
          parts.owner,
          parts.repo,
          issueNumber,
        );
        if (result.ok) {
          comments = mapGitHubIssueComments(result.comments);
        }
      }
    }

    const detail = issueRecordToDetail(record, { comments });
    return issueGetResult.parse({ found: true, detail });
  });

  ipcMain.handle(IpcChannels.issueCreate, async (_event, raw: unknown) => {
    const payload = issueCreatePayload.parse(raw);
    const workspaces = getWorkspaceStore();
    const issues = getIssueCacheStore();
    const id = payload.workspaceId ?? workspaces.getActiveId();
    const workspace = workspaces.list().find((row) => row.id === id);
    const repository = workspace?.repository;

    if (!repository) {
      return issueCreateResult.parse({ ok: false, message: "Workspace is not linked to GitHub" });
    }

    const token = readGitHubToken();
    if (!token) {
      return issueCreateResult.parse({ ok: false, message: "GitHub is not connected" });
    }

    const parts = parseRepository(repository);
    if (!parts) {
      return issueCreateResult.parse({ ok: false, message: "Invalid repository on workspace" });
    }

    const labels = labelsForNewIssue({
      type: payload.type,
      priority: payload.priority,
      agentReady: payload.agentReady,
    });

    const created = await createGitHubIssue(token, parts.owner, parts.repo, {
      title: payload.title.trim(),
      body: payload.body,
      labels,
    });
    if (!created.ok) {
      return issueCreateResult.parse({ ok: false, message: created.message });
    }

    await syncWorkspaceNow(workspaces, issues, getIssueSyncConflictStore(), id, {
      forceFull: true,
    });

    return issueCreateResult.parse({
      ok: true,
      issueNumber: created.number,
      htmlUrl: created.htmlUrl,
    });
  });
}