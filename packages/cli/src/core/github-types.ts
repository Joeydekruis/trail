/**
 * Minimal fields from GitHub REST issue JSON (list and single resource).
 */
export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: { name: string }[];
  assignee: { login: string } | null;
  milestone: { title: string } | null;
  html_url: string;
  updated_at: string;
}

/** User who can be assigned to issues in a repository. */
export interface GitHubAssignee {
  login: string;
  id: number;
  avatar_url: string;
}

/** Issue comment from GitHub REST API (not the issue body). */
export interface GitHubIssueComment {
  id: number;
  body: string;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}
