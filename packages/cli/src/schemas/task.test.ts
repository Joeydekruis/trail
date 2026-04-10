import { describe, it, expect } from "vitest";
import { TaskStatusSchema } from "./task.js";

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
