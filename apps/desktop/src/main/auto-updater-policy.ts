export function shouldDeferAppUpdateInstall(input: {
  updateDownloaded: boolean;
  activeAgentRuns: number;
}): boolean {
  return input.updateDownloaded && input.activeAgentRuns > 0;
}

export function shouldQuitAndInstallUpdate(input: {
  updateDownloaded: boolean;
  activeAgentRuns: number;
}): boolean {
  return input.updateDownloaded && input.activeAgentRuns === 0;
}