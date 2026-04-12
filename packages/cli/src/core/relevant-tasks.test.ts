import { describe, expect, it } from "vitest";

import { computeRelevantTaskIds, isActiveForRelevance } from "./relevant-tasks.js";
import type { Task } from "../schemas/task.js";

function baseTask(overrides: Partial<Task>): Task {
  return {
    id: "1",
    title: "T",
    status: "todo",
    type: "feature",
    labels: [],
    depends_on: [],
    blocks: [],
    refs: [],
    created_at: "2026-04-01T10:00:00.000Z",
    updated_at: "2026-04-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("relevant-tasks", () => {
  it("isActiveForRelevance is false for done and cancelled", () => {
    expect(isActiveForRelevance(baseTask({ status: "done" }))).toBe(false);
    expect(isActiveForRelevance(baseTask({ status: "cancelled" }))).toBe(false);
    expect(isActiveForRelevance(baseTask({ status: "todo" }))).toBe(true);
  });

  it("computeRelevantTaskIds includes dependency closure", () => {
    const tasks: Task[] = [
      baseTask({ id: "10", status: "todo", depends_on: ["99"] }),
      baseTask({ id: "99", status: "done", depends_on: [] }),
    ];
    const ids = computeRelevantTaskIds(tasks);
    expect(ids.has("10")).toBe(true);
    expect(ids.has("99")).toBe(true);
  });

  it("computeRelevantTaskIds follows blocks and parent", () => {
    const tasks: Task[] = [
      baseTask({ id: "a", status: "in_progress", blocks: ["b"] }),
      baseTask({ id: "b", status: "done", depends_on: [] }),
      baseTask({ id: "c", status: "draft", parent: "d" }),
      baseTask({ id: "d", status: "done", depends_on: [] }),
    ];
    const ids = computeRelevantTaskIds(tasks);
    expect(ids.has("a")).toBe(true);
    expect(ids.has("b")).toBe(true);
    expect(ids.has("c")).toBe(true);
    expect(ids.has("d")).toBe(true);
  });
});
