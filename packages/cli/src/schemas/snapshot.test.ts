import { describe, it, expect } from "vitest";

import { SnapshotSchema } from "./snapshot.js";

describe("SnapshotSchema", () => {
  it("round-trips a snapshot with empty tasks", () => {
    const input = {
      generated_at: "2026-04-10T15:00:00.000Z",
      tasks: [],
      warnings: [],
    };
    const parsed = SnapshotSchema.parse(input);
    const json = JSON.stringify(parsed);
    const again = SnapshotSchema.parse(JSON.parse(json));
    expect(again).toEqual(parsed);
    expect(again.tasks).toEqual([]);
  });
});
