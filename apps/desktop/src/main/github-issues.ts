import {
  etagFromResponse,
  githubHttpFailure,
  isPullRequestIssue,
  mapGitHubIssueToCache,
  withIfNoneMatch,
  workspaceIssuesEtagKey,
  type GitHubIssuePayload,
  type IssueCacheRecord,
  type WorkspaceStore,
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

export type FetchWorkspaceIssuesResult =
  | { ok: true; issues: IssueCacheRecord[]; notModified?: false }
  | { ok: true; notModified: true }
  | { ok: false; message: string; retryAfterSec?: number; rateLimited?: boolean };

export async function fetchWorkspaceIssues(
  token: string,
  workspaceId: string,
  owner: string,
  repo: string,
  workspaces: WorkspaceStore,
  options?: { forceFull?: boolean },
): Promise<FetchWorkspaceIssuesResult> {
  const storedEtag = options?.forceFull
    ? null
    : workspaces.getAppSetting(workspaceIssuesEtagKey(workspaceId));
  const issues: IssueCacheRecord[] = [];
  let pageOneEtag: string | null = null;

  for (let page = 1; page <= 10; page += 1) {
    const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=all&per_page=100&page=${page}`;
    const headers =
      page === 1 ? withIfNoneMatch(authHeaders(token), storedEtag) : authHeaders(token);
    const response = await fetch(url, { headers });

    if (page === 1 && response.status === 304) {
      return { ok: true, notModified: true };
    }

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
      const failure = githubHttpFailure(response.status, message, response.headers);
      return {
        ok: false,
        message: failure.message,
        retryAfterSec: failure.retryAfterSec,
        rateLimited: failure.rateLimited,
      };
    }

    if (page === 1) {
      pageOneEtag = etagFromResponse(response.headers);
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

  if (pageOneEtag) {
    workspaces.setAppSetting(workspaceIssuesEtagKey(workspaceId), pageOneEtag);
  }

  return { ok: true, issues };
}