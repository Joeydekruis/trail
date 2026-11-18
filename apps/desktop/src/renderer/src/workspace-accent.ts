import type { WorkspaceDto } from "@trail/ipc";

export function applyWorkspaceAccent(workspace: WorkspaceDto): void {
  const root = document.documentElement;
  root.style.setProperty("--accent", workspace.accent);
  root.style.setProperty("--accent-soft", workspace.accentSoft);
  root.style.setProperty("--accent-line", workspace.accentLine);
  root.style.setProperty("--on-accent", workspace.onAccent);
}