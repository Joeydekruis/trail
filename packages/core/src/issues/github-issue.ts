import { defaultBoardColumn } from "./columns.js";
import { priorityFromLabelNames } from "./priority.js";
import type { IssueCacheRecord } from "./types.js";

export type GitHubIssuePayload = {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string } | string>;
  updated_at: string;
  html_url: string;
  body?: string | null;
  assignee?: { login: string } | null;
  pull_request?: unknown;
};

export function isPullRequestIssue(issue: GitHubIssuePayload): boolean {
  return issue.pull_request != null;
}

export function mapGitHubIssueToCache(
  workspaceId: string,
  issue: GitHubIssuePayload,
): IssueCacheRecord {
  const labelNames = issue.labels.map((label) =>
    typeof label === "string" ? label : label.name,
  );
  return {
    workspaceId,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    boardColumn: defaultBoardColumn(issue.state),
    priority: priorityFromLabelNames(labelNames),
    labels: labelNames.filter((name) => !name.toLowerCase().startsWith("priority:")),
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
    body: issue.body ?? null,
    assigneeLogin: issue.assignee?.login?.trim() || null,
  };
}