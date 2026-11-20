import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openWorkspaceStore } from "./store.js";
import {
  shortLabelFromName,
  workspaceIdFromRepository,
  workspaceNameFromRepository,
} from "./repository.js";

describe("workspace repository helpers", () => {
  it("derives id and display name from owner/repo", () => {
    expect(workspaceIdFromRepository("Joeydekruis/Trail")).toBe("joeydekruis-trail");
    expect(workspaceNameFromRepository("joeydekrujs/trail")).toBe("Trail");
    expect(shortLabelFromName("Trail")).toBe("T");
  });

  it("rejects invalid repository strings", () => {
    expect(() => workspaceIdFromRepository("no-slash")).toThrow(/Invalid repository/);
  });
});

describe("WorkspaceStore.create", () => {
  it("adds a linked workspace and removes demo rows on first link", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(store.list().every((w) => w.repository === null)).toBe(true);

    const created = store.create({
      repository: "joeydekrujs/trail",
      integrationBranch: "development",
    });

    expect(created.repository).toBe("joeydekrujs/trail");
    expect(created.id).toBe("joeydekrujs-trail");
    expect(created.name).toBe("Trail");
    expect(store.list()).toHaveLength(1);
    expect(store.getActiveId()).toBe(created.id);
  });

  it("rejects duplicate repository", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    store.create({ repository: "acme/widget" });
    expect(() => store.create({ repository: "acme/widget" })).toThrow(/already exists/);
  });
});