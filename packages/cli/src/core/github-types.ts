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
