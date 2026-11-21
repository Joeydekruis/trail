const pauseUntilByWorkspace = new Map<string, number>();

export function noteGitHubRateLimit(workspaceId: string, retryAfterSec: number): void {
  pauseUntilByWorkspace.set(workspaceId, Date.now() + retryAfterSec * 1_000);
}

export function clearGitHubRateLimitPause(workspaceId: string): void {
  pauseUntilByWorkspace.delete(workspaceId);
}

export function rateLimitPauseRemainingMs(workspaceId: string, nowMs = Date.now()): number | null {
  const until = pauseUntilByWorkspace.get(workspaceId);
  if (!until) {
    return null;
  }
  const remaining = until - nowMs;
  if (remaining <= 0) {
    pauseUntilByWorkspace.delete(workspaceId);
    return null;
  }
  return remaining;
}

export function rateLimitResumeAt(workspaceId: string): number | null {
  return pauseUntilByWorkspace.get(workspaceId) ?? null;
}