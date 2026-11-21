import { describe, expect, it } from "vitest";
import type { BoardListGroup } from "./design/board-fixture";
import { flattenBoardListGroups } from "./board-list-flatten";

describe("flattenBoardListGroups", () => {
  it("interleaves headers, rows, and more lines", () => {
    const groups: BoardListGroup[] = [
      {
        name: "Todo",
        tone: "blue",
        count: 2,
        rows: [
          { issue: "#1", title: "One", adr: "—", pr: "—", syncLabel: "Synced", by: "—" },
          { issue: "#2", title: "Two", adr: "—", pr: "—", syncLabel: "Synced", by: "—" },
        ],
        moreText: "+3 more",
      },
    ];
    const flat = flattenBoardListGroups(groups);
    expect(flat.map((item) => item.type)).toEqual(["header", "row", "row", "more"]);
    expect(flat[0]?.type === "header" && flat[0].name).toBe("Todo");
    expect(flat[1]?.type === "row" && flat[1].row.issue).toBe("#1");
  });
});