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

  it("tracks linked workspaces, settings, and last sync", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(store.hasLinkedWorkspace()).toBe(false);
    store.setAppSetting("github_login", "you");
    expect(store.getAppSetting("github_login")).toBe("you");
    const created = store.create({ repository: "acme/widget" });
    expect(store.hasLinkedWorkspace()).toBe(true);
    store.setLastSyncAt(created.id, "2026-01-01T00:00:00.000Z");
    expect(store.getLastSyncAt(created.id)).toBe("2026-01-01T00:00:00.000Z");
    store.deleteAppSetting("github_login");
    expect(store.getAppSetting("github_login")).toBeNull();
  });
});