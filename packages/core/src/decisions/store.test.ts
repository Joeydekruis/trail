import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { openDecisionStore } from "./store.js";

describe("DecisionStore", () => {
  it("seeds demo ADRs and accepts proposed", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const store = openDecisionStore(db);
    const ws = workspaces.getActive();
    const rows = store.list(ws.id);
    expect(rows.some((row) => row.adrId === "ADR-012" && row.status === "proposed")).toBe(true);
    const accepted = store.accept(ws.id, "ADR-012");
    expect(accepted?.status).toBe("accepted");
    expect(accepted?.blocksIssueNumber).toBeNull();
  });

  it("rejects proposed and clears block", () => {
    const db = new MemorySqlite();
    const workspaces = openWorkspaceStore(db);
    const store = openDecisionStore(db);
    const ws = workspaces.getActive();
    const rejected = store.reject(ws.id, "ADR-012");
    expect(rejected?.status).toBe("rejected");
    expect(rejected?.blocksIssueNumber).toBeNull();
    expect(store.reject(ws.id, "ADR-011")).toBeNull();
  });
});