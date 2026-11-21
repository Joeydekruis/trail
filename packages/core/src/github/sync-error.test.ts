import { describe, expect, it } from "vitest";
import {
  formatGitHubSyncErrorMessage,
  GITHUB_NOT_REACHABLE_MESSAGE,
  isGitHubUnreachableError,
} from "./sync-error.js";

describe("isGitHubUnreachableError", () => {
  it("detects network failures", () => {
    expect(isGitHubUnreachableError("fetch failed")).toBe(true);
    expect(isGitHubUnreachableError("Could not reach GitHub (503)")).toBe(true);
  });

  it("ignores missing token", () => {
    expect(isGitHubUnreachableError("GitHub is not connected")).toBe(false);
  });
});

describe("formatGitHubSyncErrorMessage", () => {
  it("normalizes unreachable errors", () => {
    expect(formatGitHubSyncErrorMessage("fetch failed")).toBe(GITHUB_NOT_REACHABLE_MESSAGE);
    expect(formatGitHubSyncErrorMessage("Bad credentials")).toBe("Bad credentials");
  });
});