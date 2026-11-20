/** Preload-safe channel ids (keep in sync with @trail/ipc). */
export const PreloadIpcChannels = {
  workspaceList: "workspace.list",
  workspaceSwitch: "workspace.switch",
  workspaceCreate: "workspace.create",
  githubStatus: "github.status",
  githubSetToken: "github.setToken",
  githubListRepos: "github.listRepos",
  githubListBranches: "github.listBranches",
  githubClearToken: "github.clearToken",
  boardSnapshot: "board.snapshot",
  issueGet: "issue.get",
  syncNow: "sync.now",
  windowMinimize: "window.minimize",
  windowMaximize: "window.maximize",
  windowClose: "window.close",
  shellOpenExternal: "shell.openExternal",
} as const;