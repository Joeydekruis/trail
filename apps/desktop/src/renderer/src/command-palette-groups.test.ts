import { describe, expect, it } from "vitest";
import { buildCommandPaletteGroups } from "./command-palette-groups";

describe("buildCommandPaletteGroups", () => {
  it("includes live tasks and filters by query", () => {
    const groups = buildCommandPaletteGroups({
      query: "sync",
      worktrees: [],
      catalog: {
        board: {
          source: "cache",
          repository: "o/r",
          openCount: 1,
          columns: [
            {
              id: "todo",
              name: "Todo",
              count: 1,
              tone: "gray",
              ghLabel: "Todo",
              cards: [
                {
                  issue: "#12",
                  title: "Sync board columns",
                  prioColor: "var(--blue)",
                  prioLabel: "Medium",
                  labels: [],
                  syncStatus: "synced",
                },
              ],
            },
          ],
        },
        decisions: [{ adrId: "ADR-001", title: "Other", status: "accepted", author: "a", updatedAt: "t", blocksIssueNumber: null }],
        docs: [{ slug: "sync", title: "Sync notes", updatedAt: "t" }],
      },
    });
    const titles = groups.flatMap((g) => g.items.map((i) => i.title));
    expect(titles.some((t) => t.includes("Sync board"))).toBe(true);
    expect(titles.some((t) => t.includes("Sync notes"))).toBe(true);
    expect(titles.some((t) => t.includes("ADR-001"))).toBe(false);
  });
});