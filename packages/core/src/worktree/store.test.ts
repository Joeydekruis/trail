import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { migrateAndSeed } from "../workspace/schema.js";
import { worktreeId, WorktreeStore, openWorktreeStore } from "./store.js";

describe("WorktreeStore", () => {
  it("lists worktrees per workspace", () => {
    const db = new MemorySqlite();
    migrateAndSeed(db);
    const store = openWorktreeStore(db);
    const now = new Date().toISOString();
    store.upsert({
      id: worktreeId("trail", 42),
      workspaceId: "trail",
      issueNumber: 42,
      title: "Fix redirect",
      branch: "agent/42-fix-redirect",
      path: "/tmp/42",
      status: "queued",
      isRemote: false,
      createdAt: now,
    });
    expect(store.listByWorkspace("trail")).toHaveLength(1);
    expect(store.listByWorkspace("loupe")).toHaveLength(0);
  });
});