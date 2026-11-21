import { createGitHubIssueComment } from "./github-api";
import { readGitHubToken } from "./github-token-store";
import { getWorkspaceStore } from "./database";

function parseRepository(fullName: string): { owner: string; repo: string } | null {
  const slash = fullName.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return {
    owner: fullName.slice(0, slash),
    repo: fullName.slice(slash + 1),
  };
}

export async function mcpAddTaskComment(input: {
  workspaceId: string;
  issueNumber: number;
  body: string;
}): Promise<
  | { ok: true; issueNumber: number; commentId: number; htmlUrl: string }
  | { ok: false; message: string }
> {
  if (process.env.TRAIL_E2E === "1") {
    return {
      ok: true,
      issueNumber: input.issueNumber,
      commentId: 0,
      htmlUrl: `https://github.com/example/repo/issues/${input.issueNumber}#e2e`,
    };
  }
  const workspace = getWorkspaceStore().list().find((row) => row.id === input.workspaceId);
  const repository = workspace?.repository;
  if (!repository) {
    return { ok: false, message: "Workspace is not linked to GitHub" };
  }
  const token = readGitHubToken();
  if (!token) {
    return { ok: false, message: "GitHub is not connected" };
  }
  const parts = parseRepository(repository);
  if (!parts) {
    return { ok: false, message: "Invalid repository on workspace" };
  }
  const posted = await createGitHubIssueComment(
    token,
    parts.owner,
    parts.repo,
    input.issueNumber,
    input.body,
  );
  if (!posted.ok) {
    return posted;
  }
  return {
    ok: true,
    issueNumber: input.issueNumber,
    commentId: posted.id,
    htmlUrl: posted.htmlUrl,
  };
}