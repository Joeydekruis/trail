import { describe, it, expect } from "vitest";

import { TaskSchema, TaskStatusSchema } from "./task.js";

describe("TaskStatusSchema", () => {
  it("accepts valid statuses", () => {
    expect(TaskStatusSchema.parse("draft")).toBe("draft");
    expect(TaskStatusSchema.parse("todo")).toBe("todo");
    expect(TaskStatusSchema.parse("in_progress")).toBe("in_progress");
    expect(TaskStatusSchema.parse("done")).toBe("done");
  });

  it("rejects invalid statuses", () => {
    expect(() => TaskStatusSchema.parse("invalid")).toThrow();
    expect(() => TaskStatusSchema.parse("")).toThrow();
    expect(() => TaskStatusSchema.parse(123)).toThrow();
  });
});

describe("TaskSchema", () => {
  const minimalValidTask = {
    id: "047",
    title: "Example",
    status: "todo",
    type: "feature",
    created_at: "2026-04-10T10:00:00.000Z",
    updated_at: "2026-04-10T14:30:00.000Z",
  };

  it("parses a minimal valid task", () => {
    const parsed = TaskSchema.parse(minimalValidTask);
    expect(parsed.id).toBe("047");
    expect(parsed.labels).toEqual([]);
    expect(parsed.depends_on).toEqual([]);
    expect(parsed.blocks).toEqual([]);
    expect(parsed.refs).toEqual([]);
  });

  it("round-trips a minimal task through JSON", () => {
    const first = TaskSchema.parse(minimalValidTask);
    const json = JSON.stringify(first);
    const second = TaskSchema.parse(JSON.parse(json));
    expect(second).toEqual(first);
  });

  it("rejects an invalid status", () => {
    expect(() =>
      TaskSchema.parse({
        ...minimalValidTask,
        status: "open",
      }),
    ).toThrow();
  });
});
