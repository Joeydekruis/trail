import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  compileSnapshot,
  detectCycles,
  writeSnapshot,
} from "./compile-snapshot.js";
import { SnapshotSchema } from "../schemas/snapshot.js";
import type { Task } from "../schemas/task.js";

function baseTask(overrides: Partial<Task> & Pick<Task, "id">): Task {
  return {
    title: "T",
    status: "todo",
    type: "feature",
    labels: [],
    depends_on: [],
    blocks: [],
    refs: [],
    created_at: "2026-04-10T10:00:00.000Z",
    updated_at: "2026-04-10T14:30:00.000Z",
    ...overrides,
  } as Task;
}

describe("detectCycles", () => {
  it("returns [] for an acyclic graph", () => {
    const ids = new Set(["a", "b", "c"]);
    const deps = new Map<string, string[]>([
      ["a", ["b"]],
      ["b", ["c"]],
      ["c", []],
    ]);
    expect(detectCycles(ids, deps)).toEqual([]);
  });

  it("detects A → B → A", () => {
    const ids = new Set(["a", "b"]);
    const deps = new Map<string, string[]>([
      ["a", ["b"]],
      ["b", ["a"]],
    ]);
    const cycles = detectCycles(ids, deps);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(["a", "b"]);
  });
});

describe("compileSnapshot", () => {
  it("emits no cycle warnings for acyclic depends_on", () => {
    const tasks: Task[] = [
      baseTask({ id: "1", depends_on: [] }),
      baseTask({ id: "2", depends_on: ["1"] }),
      baseTask({ id: "3", depends_on: ["2"] }),
    ];
    const fixed = new Date("2026-04-11T12:00:00.000Z");
    const snap = compileSnapshot(tasks, fixed);
    expect(snap.generated_at).toBe("2026-04-11T12:00:00.000Z");
    expect(snap.tasks).toEqual(tasks);
    expect(
      snap.warnings.filter((w) => w.code === "DEPENDENCY_CYCLE"),
    ).toHaveLength(0);
    expect(SnapshotSchema.safeParse(snap).success).toBe(true);
  });

  it("warns on A → B → A dependency cycle", () => {
    const tasks: Task[] = [
      baseTask({ id: "a", depends_on: ["b"] }),
      baseTask({ id: "b", depends_on: ["a"] }),
    ];
    const snap = compileSnapshot(tasks);
    const cycleWarnings = snap.warnings.filter(
      (w) => w.code === "DEPENDENCY_CYCLE",
    );
    expect(cycleWarnings.length).toBeGreaterThanOrEqual(1);
    expect(cycleWarnings[0].message).toContain("a");
    expect(cycleWarnings[0].message).toContain("b");
    expect(cycleWarnings[0].taskId).toBe("a");
  });

  it("warns when depends_on references an unknown task id", () => {
    const tasks: Task[] = [
      baseTask({ id: "x", depends_on: ["missing"] }),
    ];
    const snap = compileSnapshot(tasks);
    const unknown = snap.warnings.filter((w) => w.code === "UNKNOWN_DEPENDENCY");
    expect(unknown).toHaveLength(1);
    expect(unknown[0].message).toContain("missing");
    expect(unknown[0].taskId).toBe("x");
  });
});

describe("writeSnapshot", () => {
  it("writes pretty JSON with trailing newline and validates", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-snapshot-"));
    const snapshotPath = path.join(dir, "nested", "snapshot.json");
    const tasks: Task[] = [baseTask({ id: "1" })];
    const snap = compileSnapshot(tasks);
    writeSnapshot(snapshotPath, snap);

    const raw = fs.readFileSync(snapshotPath, "utf8");
    expect(raw.endsWith("\n")).toBe(true);
    const parsed = JSON.parse(raw) as unknown;
    expect(SnapshotSchema.safeParse(parsed).success).toBe(true);
  });
});
