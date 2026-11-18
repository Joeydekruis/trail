/** Preload-safe channel ids (keep in sync with @trail/ipc). */
export const PreloadIpcChannels = {
  workspaceList: "workspace.list",
  workspaceSwitch: "workspace.switch",
  syncNow: "sync.now",
  windowMinimize: "window.minimize",
  windowMaximize: "window.maximize",
  windowClose: "window.close",
} as const;