import { describe, expect, it } from "vitest";
import { MemorySqlite } from "../db/memory.js";
import { migrateAndSeed } from "../workspace/schema.js";
import { openPreviewPinStore } from "./pin-store.js";

describe("PreviewPinStore", () => {
  it("assigns incrementing pin numbers", () => {
    const db = new MemorySqlite();
    migrateAndSeed(db);
    const store = openPreviewPinStore(db);
    const anchor = {
      selector: "#btn",
      xpath: "/button[1]",
      elementText: "Sign in",
      offsetX: 0.5,
      offsetY: 0.5,
      viewportWidth: 800,
      viewportHeight: 600,
      pageUrl: "http://127.0.0.1:3000/",
    };
    const first = store.create({
      workspaceId: "trail",
      issueNumber: 42,
      comment: "Contrast",
      anchor,
    });
    const second = store.create({
      workspaceId: "trail",
      issueNumber: 42,
      comment: "Spacing",
      anchor,
    });
    expect(first.pinNumber).toBe(1);
    expect(second.pinNumber).toBe(2);
    expect(store.list("trail", 42)).toHaveLength(2);
  });
});