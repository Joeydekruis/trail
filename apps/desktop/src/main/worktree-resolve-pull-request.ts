import { getWorktreeStore, getWorkspaceStore } from "./database";
import { findOpenPullRequestByHead } from "./github-api";
import { readGitHubToken } from "./github-token-store";

function parseRepository(repository: string): { owner: string; repo: string } | null {
  const slash = repository.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return {
    owner: repository.slice(0, slash),
    repo: repository.slice(slash + 1),
  };
}

export async function resolveWorktreePullRequestUrl(
  workspaceId: string,
  issueNumber: number,
): Promise<{ ok: true; htmlUrl: string } | { ok: false; message: string }> {
  const worktreeStore = getWorktreeStore();
  const record = worktreeStore.get(workspaceId, issueNumber);
  if (!record) {
    return { ok: false, message: "Worktree not found" };
  }
  if (record.pullRequestUrl) {
    return { ok: true, htmlUrl: record.pullRequestUrl };
  }

  const workspace = getWorkspaceStore().list().find((row) => row.id === workspaceId);
  const token = readGitHubToken();
  if (!workspace?.repository || !token) {
    return { ok: false, message: "Connect GitHub to open the pull request" };
  }

  const parts = parseRepository(workspace.repository);
  if (!parts) {
    return { ok: false, message: "Invalid repository configuration" };
  }

  const found = await findOpenPullRequestByHead(token, parts.owner, parts.repo, record.branch);
  if (!found.ok) {
    return found;
  }

  worktreeStore.upsert({
    ...record,
    pullRequestUrl: found.htmlUrl,
  });
  return found;
}