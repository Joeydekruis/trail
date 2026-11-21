import { describe, expect, it } from "vitest";
import {
  formatRateLimitBannerMessage,
  githubHttpFailure,
  retryAfterSecFromHeaders,
} from "./rate-limit.js";
import { GITHUB_RATE_LIMIT_MESSAGE } from "./sync-error.js";

describe("retryAfterSecFromHeaders", () => {
  it("reads Retry-After and X-RateLimit-Reset", () => {
    const headers = new Headers({ "Retry-After": "120" });
    expect(retryAfterSecFromHeaders(headers)).toBe(120);

    const now = 1_700_000_000_000;
    const resetHeaders = new Headers({ "X-RateLimit-Reset": String(Math.floor(now / 1_000) + 90) });
    expect(retryAfterSecFromHeaders(resetHeaders, now)).toBe(90);
  });
});

describe("githubHttpFailure", () => {
  it("marks 429 as rate limited with fallback backoff", () => {
    const failure = githubHttpFailure(429, "Too Many Requests", new Headers());
    expect(failure.rateLimited).toBe(true);
    expect(failure.message).toBe(GITHUB_RATE_LIMIT_MESSAGE);
    expect(failure.retryAfterSec).toBe(60);
  });
});

describe("formatRateLimitBannerMessage", () => {
  it("includes minutes until resume", () => {
    const now = Date.now();
    const text = formatRateLimitBannerMessage(now + 5 * 60_000, now);
    expect(text).toContain("5 minutes");
  });
});