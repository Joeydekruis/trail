import { describe, expect, it } from "vitest";
import {
  DEFAULT_SYNC_INTERVAL_SEC,
  draftIssueFromPrompt,
  formatWorkspaceRepoLine,
} from "./client.js";

describe("@trail/core/client", () => {
  it("exports renderer-safe helpers", () => {
    expect(DEFAULT_SYNC_INTERVAL_SEC).toBe(60);
    expect(
      formatWorkspaceRepoLine({
        repository: "acme/widget",
        integrationBranch: "main",
      }),
    ).toBe("acme/widget · main");
    expect(draftIssueFromPrompt("fix the login bug").title.length).toBeGreaterThan(0);
  });
});