import {
  formatGitHubSyncErrorMessage,
  GITHUB_RATE_LIMIT_MESSAGE,
  isGitHubRateLimitError,
} from "./sync-error.js";

export const DEFAULT_RATE_LIMIT_BACKOFF_SEC = 60 as const;

export function retryAfterSecFromHeaders(headers: Headers, nowMs = Date.now()): number | undefined {
  const retryAfter = headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds;
    }
  }
  const reset = headers.get("X-RateLimit-Reset");
  if (reset) {
    const resetMs = Number.parseInt(reset, 10) * 1_000;
    if (Number.isFinite(resetMs)) {
      const seconds = Math.ceil((resetMs - nowMs) / 1_000);
      if (seconds > 0) {
        return seconds;
      }
    }
  }
  return undefined;
}

export function isGitHubRateLimitHttpStatus(status: number, message: string): boolean {
  if (status === 429) {
    return true;
  }
  if (status === 403 && isGitHubRateLimitError(message)) {
    return true;
  }
  return false;
}

export type GitHubHttpFailure = {
  message: string;
  retryAfterSec?: number;
  rateLimited: boolean;
};

export function githubHttpFailure(
  status: number,
  message: string,
  headers: Headers,
  nowMs = Date.now(),
): GitHubHttpFailure {
  const rateLimited = isGitHubRateLimitHttpStatus(status, message);
  const retryAfterSec = rateLimited
    ? (retryAfterSecFromHeaders(headers, nowMs) ?? DEFAULT_RATE_LIMIT_BACKOFF_SEC)
    : undefined;
  return {
    message: rateLimited ? GITHUB_RATE_LIMIT_MESSAGE : formatGitHubSyncErrorMessage(message),
    retryAfterSec,
    rateLimited,
  };
}

export function formatRateLimitBannerMessage(resumeAtMs: number | null, nowMs = Date.now()): string {
  if (!resumeAtMs || resumeAtMs <= nowMs) {
    return `${GITHUB_RATE_LIMIT_MESSAGE}. Background sync will retry automatically.`;
  }
  const minutes = Math.max(1, Math.ceil((resumeAtMs - nowMs) / 60_000));
  return `${GITHUB_RATE_LIMIT_MESSAGE}. Background sync resumes in about ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}