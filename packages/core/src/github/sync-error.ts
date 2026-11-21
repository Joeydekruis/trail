export const GITHUB_NOT_REACHABLE_MESSAGE = "GitHub is not reachable" as const;
export const GITHUB_RATE_LIMIT_MESSAGE = "GitHub rate limit reached" as const;

const UNREACHABLE_PATTERNS = [
  "could not reach github",
  "fetch failed",
  "network",
  "enotfound",
  "econnrefused",
  "etimedout",
  "eai_again",
  "socket hang up",
  "failed to fetch",
  "getaddrinfo",
] as const;

export function isGitHubUnreachableError(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower || lower === "github is not connected") {
    return false;
  }
  return UNREACHABLE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isGitHubRateLimitError(message: string): boolean {
  const lower = message.trim().toLowerCase();
  return lower.includes("rate limit") || lower.includes("secondary rate");
}

export function formatGitHubSyncErrorMessage(message: string): string {
  if (isGitHubRateLimitError(message)) {
    return GITHUB_RATE_LIMIT_MESSAGE;
  }
  if (isGitHubUnreachableError(message)) {
    return GITHUB_NOT_REACHABLE_MESSAGE;
  }
  return message;
}