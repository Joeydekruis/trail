import type { IssueCacheStore, IssueSyncConflictStore, WorkspaceStore } from "@trail/core";
import { formatGitHubSyncErrorMessage, githubHttpFailure, mergeWorkspaceIssuesFromGitHub } from "@trail/core";
import { clearGitHubRateLimitPause } from "./github-rate-limit-pause";
import { fetchGitHubUser } from "./github-api";
import { fetchWorkspaceIssues } from "./github-issues";
import { fetchIssueBoardColumns } from "./github-project-status";
import { readGitHubToken } from "./github-token-store";
import { readWorkspaceProjectStatusField } from "./workspace-github-settings";

const GITHUB_API = "https://api.github.com";
const TRAIL_USER_AGENT = "Trail-Desktop";

function parseRepository(repository: string): { owner: string; repo: string } {
  const slash = repository.indexOf("/");
  if (slash <= 0 || slash === repository.length - 1) {
    throw new Error(`Invalid repository: ${repository}`);
  }
  return {
    owner: repository.slice(0, slash),
    repo: repository.slice(slash + 1),
  };
}

export async function syncWorkspaceNow(
  store: WorkspaceStore,
  issueStore: IssueCacheStore,
  conflictStore: IssueSyncConflictStore,
  workspaceId?: string,
  options?: { forceFull?: boolean },
): Promise<
  | { ok: true; syncedAt: string; issueCount: number; conflictCount: number }
  | { ok: false; message: string; retryAfterSec?: number; rateLimited?: boolean }
> {
  try {
    return await syncWorkspaceNowInner(store, issueStore, conflictStore, workspaceId, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return { ok: false, message: formatGitHubSyncErrorMessage(message) };
  }
}

async function syncWorkspaceNowInner(
  store: WorkspaceStore,
  issueStore: IssueCacheStore,
  conflictStore: IssueSyncConflictStore,
  workspaceId?: string,
  options?: { forceFull?: boolean },
): Promise<
  | { ok: true; syncedAt: string; issueCount: number; conflictCount: number }
  | { ok: false; message: string; retryAfterSec?: number; rateLimited?: boolean }
> {
  const token = readGitHubToken();
  if (!token) {
    return { ok: false, message: "GitHub is not connected" };
  }

  const user = await fetchGitHubUser(token);
  if (!user.ok) {
    return {
      ok: false,
      message: user.message,
      retryAfterSec: user.retryAfterSec,
      rateLimited: user.rateLimited,
    };
  }

  const id = workspaceId ?? store.getActiveId();
  const workspace = store.list().find((row) => row.id === id);
  if (!workspace?.repository) {
    return { ok: false, message: "This workspace has no GitHub repository linked" };
  }

  const { owner, repo } = parseRepository(workspace.repository);
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": TRAIL_USER_AGENT,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    let message = `Could not reach GitHub (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    const failure = githubHttpFailure(response.status, message, response.headers);
    return {
      ok: false,
      message: failure.message,
      retryAfterSec: failure.retryAfterSec,
      rateLimited: failure.rateLimited,
    };
  }

  const fetched = await fetchWorkspaceIssues(token, id, owner, repo, store, options);
  if (!fetched.ok) {
    return {
      ok: false,
      message: fetched.message,
      retryAfterSec: fetched.retryAfterSec,
      rateLimited: fetched.rateLimited,
    };
  }

  if (fetched.notModified) {
    const syncedAt = new Date().toISOString();
    store.setLastSyncAt(id, syncedAt);
    clearGitHubRateLimitPause(id);
    const issueCount = issueStore.listByWorkspace(id).length;
    const conflictCount = conflictStore.listByWorkspace(id).length;
    return { ok: true, syncedAt, issueCount, conflictCount };
  }

  const statusField = readWorkspaceProjectStatusField(store, id);
  const columns = await fetchIssueBoardColumns(token, owner, repo, statusField);
  const issues = fetched.issues.map((issue) => {
    if (!columns.ok) {
      return issue;
    }
    const mapped = columns.byIssue.get(issue.number);
    if (!mapped) {
      return issue;
    }
    return { ...issue, boardColumn: mapped };
  });

  const syncedAt = new Date().toISOString();
  const local = issueStore.listByWorkspace(id);
  const { merged, conflicts } = mergeWorkspaceIssuesFromGitHub(
    id,
    local,
    issues,
    syncedAt,
  );
  issueStore.replaceWorkspaceIssues(id, merged);
  conflictStore.replaceWorkspaceConflicts(id, conflicts);
  store.setLastSyncAt(id, syncedAt);
  clearGitHubRateLimitPause(id);
  return {
    ok: true,
    syncedAt,
    issueCount: merged.length,
    conflictCount: conflicts.length,
  };
}