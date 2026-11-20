/** Slug for branch paths: lowercase, hyphenated, no leading/trailing hyphens. */
export function slugFromIssueTitle(title: string, maxLength = 48): string {
  const raw = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = raw.length > 0 ? raw : "task";
  if (slug.length <= maxLength) {
    return slug;
  }
  const trimmed = slug.slice(0, maxLength).replace(/-+$/g, "");
  return trimmed.length > 0 ? trimmed : "task";
}

export function branchNameForIssue(issueNumber: number, title: string): string {
  return `agent/${issueNumber}-${slugFromIssueTitle(title)}`;
}

/** Worktree directory name — task number per ADR-010. */
export function worktreeDirectoryName(issueNumber: number): string {
  return String(issueNumber);
}