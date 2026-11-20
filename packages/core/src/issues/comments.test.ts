import { describe, expect, it } from "vitest";
import { formatCommentWhen, mapGitHubIssueComments } from "./comments.js";

describe("mapGitHubIssueComments", () => {
  it("maps GitHub rows to modal comments", () => {
    const comments = mapGitHubIssueComments([
      {
        user: { login: "joeydekruis" },
        body: "Looks good",
        created_at: "2026-01-01T12:00:00Z",
      },
    ]);
    expect(comments).toHaveLength(1);
    expect(comments[0]?.who).toBe("joeydekruis");
    expect(comments[0]?.text).toBe("Looks good");
    expect(comments[0]?.initials).toBe("JO");
  });
});

describe("formatCommentWhen", () => {
  it("returns minutes ago for recent comments", () => {
    const now = Date.parse("2026-01-01T12:30:00Z");
    const label = formatCommentWhen("2026-01-01T12:00:00Z", now);
    expect(label).toBe("30m ago");
  });
});