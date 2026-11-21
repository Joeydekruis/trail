/** Stable slug for knowledge doc titles (SQLite key per workspace). */
export function slugFromTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : "doc";
}

export function knowledgeDocId(workspaceId: string, slug: string): string {
  return `${workspaceId}:${slug}`;
}