import { describe, expect, it } from "vitest";
import { draftPullRequestBody, draftPullRequestTitle } from "./draft-pr.js";

describe("draftPullRequestTitle", () => {
  it("includes issue number and title", () => {
    expect(draftPullRequestTitle(42, "Fix redirect")).toBe("#42 Fix redirect");
  });
});

describe("draftPullRequestBody", () => {
  it("references the GitHub issue URL when present", () => {
    expect(draftPullRequestBody(7, "https://github.com/o/r/issues/7")).toContain(
      "https://github.com/o/r/issues/7",
    );
  });
});