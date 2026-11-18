import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openWorkspaceStore } from "./store.js";

describe("WorkspaceStore", () => {
  it("seeds demo workspaces on empty database", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    const workspaces = store.list();
    expect(workspaces.length).toBe(3);
    expect(workspaces.map((w) => w.id)).toEqual(["trail", "loupe", "dockyrd"]);
  });

  it("switches active workspace", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(store.getActiveId()).toBe("trail");
    const next = store.switchTo("loupe");
    expect(next.id).toBe("loupe");
    expect(store.getActiveId()).toBe("loupe");
  });

  it("rejects unknown workspace id", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(() => store.switchTo("missing")).toThrow(/Unknown workspace/);
  });
});