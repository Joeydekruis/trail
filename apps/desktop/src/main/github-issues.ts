import {
  isPullRequestIssue,
  mapGitHubIssueToCache,
  type GitHubIssuePayload,
  type IssueCacheRecord,
} from "@trail/core";

const GITHUB_API = "https://api.github.com";
const TRAIL_USER_AGENT = "Trail-Desktop";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": TRAIL_USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function fetchWorkspaceIssues(
  token: string,
  workspaceId: string,
  owner: string,
  repo: string,
): Promise<{ ok: true; issues: IssueCacheRecord[] } | { ok: false; message: string }> {
  const issues: IssueCacheRecord[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=all&per_page=100&page=${page}`;
    const response = await fetch(url, { headers: authHeaders(token) });
    if (!response.ok) {
      let message = `GitHub issues error (${response.status})`;
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
    const rows = (await response.json()) as GitHubIssuePayload[];
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      if (isPullRequestIssue(row)) {
        continue;
      }
      issues.push(mapGitHubIssueToCache(workspaceId, row));
    }
    if (rows.length < 100) {
      break;
    }
  }
  return { ok: true, issues };
}