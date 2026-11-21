import { describe, expect, it } from "vitest";
import { issueRecordToDetail } from "./detail.js";

describe("issueRecordToDetail", () => {
  it("maps cache row to modal fields", () => {
    const detail = issueRecordToDetail({
      workspaceId: "trail",
      number: 7,
      title: "Board sync",
      state: "open",
      boardColumn: "todo",
      priority: "high",
      labels: ["feature"],
      updatedAt: "2026-01-01T00:00:00Z",
      htmlUrl: "https://github.com/o/r/issues/7",
      body: "Issue body",
      assigneeLogin: null,
    });
    expect(detail.issue).toBe("#7");
    expect(detail.status).toBe("Todo");
    expect(detail.desc).toBe("Issue body");
    expect(detail.htmlUrl).toContain("issues/7");
  });
});