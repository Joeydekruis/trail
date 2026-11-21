import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openWorkspaceStore } from "../workspace/store.js";
import {
  assertMcpToolAllowed,
  readMcpWorkspaceSettings,
  writeMcpWorkspaceSettings,
} from "./settings.js";

describe("MCP workspace settings", () => {
  it("defaults to enabled read/write", () => {
    const db = new MemorySqlite();
    const store = openWorkspaceStore(db);
    const ws = store.getActive();
    const settings = readMcpWorkspaceSettings(store, ws.id);
    expect(settings.enabled).toBe(true);
    expect(settings.writeEnabled).toBe(true);
    expect(settings.allowAgentRuns).toBe(false);
  });

  it("blocks write tools when write is off", () => {
    const db = new MemorySqlite();
    const store = openWorkspaceStore(db);
    const ws = store.getActive();
    writeMcpWorkspaceSettings(store, ws.id, { writeEnabled: false });
    const gate = assertMcpToolAllowed(store, "create_decision", ws.id);
    expect(gate.ok).toBe(false);
    const read = assertMcpToolAllowed(store, "list_tasks", ws.id);
    expect(read.ok).toBe(true);
  });

  it("blocks start_agent_run until allowAgentRuns is on", () => {
    const db = new MemorySqlite();
    const store = openWorkspaceStore(db);
    const ws = store.getActive();
    const blocked = assertMcpToolAllowed(store, "start_agent_run", ws.id);
    expect(blocked.ok).toBe(false);
    writeMcpWorkspaceSettings(store, ws.id, { allowAgentRuns: true });
    const allowed = assertMcpToolAllowed(store, "start_agent_run", ws.id);
    expect(allowed.ok).toBe(true);
  });
});