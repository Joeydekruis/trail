import { describe, expect, it } from "vitest";
import { applyBoardColumnsToIssues } from "./apply-board-columns.js";
import type { IssueCacheRecord } from "./types.js";

function issue(number: number, boardColumn: IssueCacheRecord["boardColumn"]): IssueCacheRecord {
  return {
    workspaceId: "ws",
    number,
    title: `Issue ${number}`,
    state: "open",
    boardColumn,
    priority: "medium",
    labels: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    htmlUrl: `https://github.com/o/r/issues/${number}`,
    body: null,
    assigneeLogin: null,
  };
}

describe("applyBoardColumnsToIssues", () => {
  it("updates columns when GitHub Projects status differs", () => {
    const result = applyBoardColumnsToIssues(
      [issue(1, "backlog"), issue(2, "todo")],
      new Map([[1, "in-progress"]]),
    );
    expect(result[0].boardColumn).toBe("in-progress");
    expect(result[1].boardColumn).toBe("todo");
  });

  it("returns same references when nothing changes", () => {
    const rows = [issue(1, "backlog")];
    const result = applyBoardColumnsToIssues(rows, new Map());
    expect(result).toBe(rows);
  });
});