/** Default draft PR title for an agent worktree tied to a GitHub issue. */
export function draftPullRequestTitle(issueNumber: number, issueTitle: string): string {
  const trimmed = issueTitle.trim() || `Issue ${issueNumber}`;
  const title = `#${issueNumber} ${trimmed}`;
  return title.length > 240 ? `${title.slice(0, 237)}...` : title;
}

export function draftPullRequestBody(issueNumber: number, htmlUrl: string | null): string {
  const link = htmlUrl ?? `#${issueNumber}`;
  return `Automated agent work for ${link}.\n\nOpened as draft for review.`;
}