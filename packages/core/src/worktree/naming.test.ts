import { describe, expect, it } from "vitest";
import { branchNameForIssue, slugFromIssueTitle, worktreeDirectoryName } from "./naming.js";

describe("slugFromIssueTitle", () => {
  it("hyphenates words and strips punctuation", () => {
    expect(slugFromIssueTitle("Fix redirect after sign-in!")).toBe("fix-redirect-after-sign-in");
  });

  it("falls back when title is empty", () => {
    expect(slugFromIssueTitle("   ")).toBe("task");
  });
});

describe("branchNameForIssue", () => {
  it("uses agent prefix and issue number", () => {
    expect(branchNameForIssue(42, "Fix redirect")).toBe("agent/42-fix-redirect");
  });
});

describe("worktreeDirectoryName", () => {
  it("is the issue number as a string", () => {
    expect(worktreeDirectoryName(99)).toBe("99");
  });
});