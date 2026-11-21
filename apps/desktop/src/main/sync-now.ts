import type { IssueCacheStore, IssueSyncConflictStore, WorkspaceStore } from "@trail/core";
import { mergeWorkspaceIssuesFromGitHub } from "@trail/core";
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
): Promise<
  | { ok: true; syncedAt: string; issueCount: number; conflictCount: number }
  | { ok: false; message: string }
> {
  const token = readGitHubToken();
  if (!token) {
    return { ok: false, message: "GitHub is not connected" };
  }

  const user = await fetchGitHubUser(token);
  if (!user.ok) {
    return { ok: false, message: user.message };
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
    return { ok: false, message };
  }

  const fetched = await fetchWorkspaceIssues(token, id, owner, repo);
  if (!fetched.ok) {
    return { ok: false, message: fetched.message };
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
  return {
    ok: true,
    syncedAt,
    issueCount: merged.length,
    conflictCount: conflicts.length,
  };
}