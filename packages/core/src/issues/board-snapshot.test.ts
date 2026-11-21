import { describe, expect, it } from "vitest";
import { buildBoardSnapshot } from "./board-snapshot.js";
import type { IssueCacheRecord } from "./types.js";

function issue(number: number, column: IssueCacheRecord["boardColumn"]): IssueCacheRecord {
  return {
    workspaceId: "trail",
    number,
    title: `Issue ${number}`,
    state: "open",
    boardColumn: column,
    priority: "medium",
    labels: [],
    updatedAt: "2026-01-01T00:00:00.000Z",
    htmlUrl: `https://github.com/o/r/issues/${number}`,
    body: null,
    assigneeLogin: null,
  };
}

describe("buildBoardSnapshot", () => {
  it("marks cards in conflictIssueNumbers as conflict", () => {
    const snapshot = buildBoardSnapshot([issue(7, "todo"), issue(8, "todo")], {
      conflictIssueNumbers: new Set([8]),
    });
    const todo = snapshot.columns.find((column) => column.id === "todo");
    expect(todo?.cards.find((card) => card.issue === "#7")?.syncStatus).toBe("synced");
    expect(todo?.cards.find((card) => card.issue === "#8")?.syncStatus).toBe("conflict");
  });
});