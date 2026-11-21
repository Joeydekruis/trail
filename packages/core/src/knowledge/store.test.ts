import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { migrateAndSeed } from "../workspace/schema.js";
import { openKnowledgeDocStore } from "./store.js";

describe("KnowledgeDocStore", () => {
  it("seeds and saves docs", () => {
    const db = new MemorySqlite();
    migrateAndSeed(db);
    const store = openKnowledgeDocStore(db);
    const list = store.list("trail");
    expect(list.length).toBeGreaterThan(0);
    const saved = store.save({
      workspaceId: "trail",
      title: "Vision",
      bodyMarkdown: "# Vision\n\nTrail orchestrates GitHub.",
    });
    expect(saved.slug).toBe("vision");
    expect(store.get("trail", "vision")?.title).toBe("Vision");
  });
});