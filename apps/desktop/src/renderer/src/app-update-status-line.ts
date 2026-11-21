import type { AppUpdateStateDto } from "@trail/ipc";

export function appUpdateStatusLine(state: AppUpdateStateDto): string {
  if (!state.enabled) {
    return `Trail ${state.currentVersion} (development build — updates apply to packaged releases only)`;
  }
  switch (state.status) {
    case "idle":
      return `Trail ${state.currentVersion}`;
    case "checking":
      return "Checking for updates…";
    case "available":
      return state.version
        ? `Update ${state.version} found — downloading…`
        : "Update found — downloading…";
    case "downloading":
      return state.version ? `Downloading ${state.version}…` : "Downloading update…";
    case "downloaded":
      if (state.deferredByRuns) {
        return state.version
          ? `Update ${state.version} ready — waiting for agent runs to finish`
          : "Update ready — waiting for agent runs to finish";
      }
      return state.version ? `Update ${state.version} ready to install` : "Update ready to install";
    case "not-available":
      return `Trail ${state.currentVersion} is up to date`;
    case "error":
      return state.errorMessage ?? "Update check failed";
    default:
      return `Trail ${state.currentVersion}`;
  }
}

export function canInstallAppUpdate(state: AppUpdateStateDto): boolean {
  return state.enabled && state.status === "downloaded" && !state.deferredByRuns;
}