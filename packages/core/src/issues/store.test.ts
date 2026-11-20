import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { migrateAndSeed } from "../workspace/schema.js";
import { openIssueCacheStore } from "./store.js";
import { buildBoardSnapshot } from "./board-snapshot.js";

function openTestIssueStore() {
  const db = new MemorySqlite();
  migrateAndSeed(db);
  return openIssueCacheStore(db);
}

describe("IssueCacheStore", () => {
  it("replaces issues per workspace and builds board columns", () => {
    const store = openTestIssueStore();
    store.replaceWorkspaceIssues("trail", [
      {
        workspaceId: "trail",
        number: 1,
        title: "One",
        state: "open",
        boardColumn: "backlog",
        priority: "high",
        labels: ["feature"],
        updatedAt: "2026-01-01T00:00:00Z",
        htmlUrl: "https://example/1",
        body: "Body one",
      },
      {
        workspaceId: "trail",
        number: 2,
        title: "Two",
        state: "closed",
        boardColumn: "done",
        priority: "low",
        labels: [],
        updatedAt: "2026-01-02T00:00:00Z",
        htmlUrl: "https://example/2",
        body: null,
      },
    ]);

    expect(store.get("trail", 1)?.body).toBe("Body one");

    expect(store.countOpen("trail")).toBe(1);
    const snapshot = buildBoardSnapshot(store.listByWorkspace("trail"));
    expect(snapshot.openCount).toBe(1);
    expect(snapshot.columns.find((c) => c.id === "backlog")?.cards).toHaveLength(1);
    expect(snapshot.columns.find((c) => c.id === "done")?.cards).toHaveLength(1);

    expect(store.updateBoardColumn("trail", 1, "todo")).toBe(true);
    expect(store.get("trail", 1)?.boardColumn).toBe("todo");
  });
});