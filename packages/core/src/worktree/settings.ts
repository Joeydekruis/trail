import { join } from "node:path";

export function workspaceRepoRootKey(workspaceId: string): string {
  return `workspace:${workspaceId}:repo_root`;
}

export function workspaceWorktreeRootKey(workspaceId: string): string {
  return `workspace:${workspaceId}:worktree_root`;
}

export function defaultWorktreeRootForWorkspace(
  workspaceId: string,
  homeDir: string,
): string {
  return join(homeDir, "trail-worktrees", workspaceId);
}