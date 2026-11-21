import { describe, expect, it } from "vitest";
import { isPullRequestIssue, mapGitHubIssueToCache } from "./github-issue.js";

describe("mapGitHubIssueToCache", () => {
  it("skips PR-shaped issues and maps fields", () => {
    expect(
      isPullRequestIssue({
        number: 1,
        title: "PR",
        state: "open",
        labels: [],
        updated_at: "2026-01-01T00:00:00Z",
        html_url: "https://github.com/o/r/issues/1",
        pull_request: {},
      }),
    ).toBe(true);

    const mapped = mapGitHubIssueToCache("trail", {
      number: 12,
      title: "Board sync",
      state: "open",
      labels: [{ name: "priority:high" }, { name: "feature" }],
      updated_at: "2026-01-02T00:00:00Z",
      html_url: "https://github.com/o/r/issues/12",
    });

    expect(mapped.number).toBe(12);
    expect(mapped.priority).toBe("high");
    expect(mapped.boardColumn).toBe("backlog");
    expect(mapped.labels).toEqual(["feature"]);
    expect(mapped.assigneeLogin).toBeNull();
  });

  it("maps assignee login from GitHub", () => {
    const mapped = mapGitHubIssueToCache("trail", {
      number: 3,
      title: "Owned",
      state: "open",
      labels: [],
      updated_at: "2026-01-02T00:00:00Z",
      html_url: "https://github.com/o/r/issues/3",
      assignee: { login: "octocat" },
    });
    expect(mapped.assigneeLogin).toBe("octocat");
  });
});