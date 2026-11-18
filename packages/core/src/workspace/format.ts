/** Headline under screen titles: `owner/repo · branch` or placeholder when no repo. */
export function formatWorkspaceRepoLine(input: {
  repository: string | null;
  integrationBranch: string;
}): string {
  const repo = input.repository?.trim() || "No repo linked";
  return `${repo} · ${input.integrationBranch}`;
}