import { ipcMain } from "electron";
import { issueRecordToDetail, mapGitHubIssueComments } from "@trail/core";
import { IpcChannels, issueGetPayload, issueGetResult } from "@trail/ipc";
import { getIssueCacheStore, getWorkspaceStore } from "./database";
import { fetchGitHubIssueComments } from "./github-api";
import { readGitHubToken } from "./github-token-store";

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
}