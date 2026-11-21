import { homedir } from "node:os";
import {
  defaultWorktreeRootForWorkspace,
  workspaceRepoRootKey,
  workspaceWorktreeRootKey,
  type WorkspaceStore,
} from "@trail/core";

export function readWorkspaceRepoRoot(
  store: WorkspaceStore,
  workspaceId: string,
): string | null {
  const value = store.getAppSetting(workspaceRepoRootKey(workspaceId))?.trim();
  return value && value.length > 0 ? value : null;
}

export function readWorkspaceWorktreeRoot(
  store: WorkspaceStore,
  workspaceId: string,
): string {
  const stored = store.getAppSetting(workspaceWorktreeRootKey(workspaceId))?.trim();
  if (stored && stored.length > 0) {
    return stored;
  }
  return defaultWorktreeRootForWorkspace(workspaceId, homedir());
}

export function writeWorkspaceRepoRoot(
  store: WorkspaceStore,
  workspaceId: string,
  repoRoot: string | null,
): void {
  const key = workspaceRepoRootKey(workspaceId);
  if (!repoRoot?.trim()) {
    store.deleteAppSetting(key);
    return;
  }
  store.setAppSetting(key, repoRoot.trim());
}

export function writeWorkspaceWorktreeRoot(
  store: WorkspaceStore,
  workspaceId: string,
  worktreeRoot: string,
): void {
  store.setAppSetting(workspaceWorktreeRootKey(workspaceId), worktreeRoot.trim());
}