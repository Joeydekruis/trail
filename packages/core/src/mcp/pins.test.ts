import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { openDecisionStore } from "../decisions/store.js";
import { openIssueCacheStore } from "../issues/store.js";
import { openKnowledgeDocStore } from "../knowledge/store.js";
import { openPreviewPinStore } from "../preview/pin-store.js";
import { openWorktreeStore } from "../worktree/store.js";
import { openWorkspaceStore } from "../workspace/store.js";
import { mcpResolvePin } from "./pins.js";

describe("mcpResolvePin", () => {
  it("deletes pin by issue and pin number", () => {
    const db = new MemorySqlite();
    const stores = {
      workspaces: openWorkspaceStore(db),
      issues: openIssueCacheStore(db),
      knowledge: openKnowledgeDocStore(db),
      decisions: openDecisionStore(db),
      worktrees: openWorktreeStore(db),
      pins: openPreviewPinStore(db),
    };
    const ws = stores.workspaces.getActive();
    const created = stores.pins.create({
      workspaceId: ws.id,
      issueNumber: 3,
      comment: "Fix padding",
      anchor: {
        selector: ".btn",
        xpath: "/html/body/button",
        elementText: "Save",
        offsetX: 1,
        offsetY: 2,
        viewportWidth: 800,
        viewportHeight: 600,
        pageUrl: "http://localhost:3000",
      },
    });
    const result = mcpResolvePin(stores, {
      workspaceId: ws.id,
      issueNumber: 3,
      pinNumber: created.pinNumber,
    });
    expect(result.ok).toBe(true);
    expect(stores.pins.list(ws.id, 3)).toHaveLength(0);
  });
});