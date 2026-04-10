import { describe, expect, it } from "vitest";

import type { Task } from "../schemas/task.js";
import { compareTaskIds, selectNextTask } from "./next-task.js";

const base = (overrides: Partial<Task> & Pick<Task, "id" | "title" | "status">): Task => ({
  type: "feature",
  labels: [],
  depends_on: [],
  blocks: [],
  refs: [],
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

describe("compareTaskIds", () => {
  it("orders numeric strings numerically", () => {
    expect(compareTaskIds("2", "10")).toBeLessThan(0);
  });

  it("falls back to localeCompare for non-numeric ids", () => {
    expect(compareTaskIds("b", "a")).toBeGreaterThan(0);
  });
});

describe("selectNextTask", () => {
  it("returns null when there are no tasks", () => {
    expect(selectNextTask([])).toBeNull();
  });

  it("returns null when all tasks are done or cancelled", () => {
    const tasks = [
      base({ id: "1", title: "a", status: "done" }),
      base({ id: "2", title: "b", status: "cancelled" }),
    ];
    expect(selectNextTask(tasks)).toBeNull();
  });

  it("prefers p0 over p1", () => {
    const tasks = [
      base({ id: "1", title: "low", status: "todo", priority: "p1" }),
      base({ id: "2", title: "high", status: "todo", priority: "p0" }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("2");
  });

  it("breaks ties by lowest numeric id", () => {
    const tasks = [
      base({ id: "10", title: "b", status: "todo", priority: "p1" }),
      base({ id: "2", title: "a", status: "todo", priority: "p1" }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("2");
  });

  it("treats undefined priority as lowest precedence", () => {
    const tasks = [
      base({ id: "1", title: "no pri", status: "todo" }),
      base({ id: "2", title: "p3", status: "todo", priority: "p3" }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("2");
  });

  it("skips tasks blocked by incomplete dependencies", () => {
    const tasks = [
      base({ id: "1", title: "root", status: "todo" }),
      base({ id: "2", title: "blocked", status: "todo", depends_on: ["1"], priority: "p0" }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("1");
  });

  it("unblocks when dependency is done", () => {
    const tasks = [
      base({ id: "1", title: "root", status: "done" }),
      base({ id: "2", title: "next", status: "todo", depends_on: ["1"] }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("2");
  });

  it("treats cancelled dependency as resolved", () => {
    const tasks = [
      base({ id: "1", title: "root", status: "cancelled" }),
      base({ id: "2", title: "next", status: "todo", depends_on: ["1"] }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("2");
  });

  it("treats missing dependency as blocking", () => {
    const tasks = [
      base({ id: "2", title: "orphan", status: "todo", depends_on: ["missing"] }),
      base({ id: "1", title: "free", status: "todo" }),
    ];
    expect(selectNextTask(tasks)?.id).toBe("1");
  });
});
