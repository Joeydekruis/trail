import { describe, expect, it } from "vitest";

import { buildContextPacket } from "./context.js";
import type { Task } from "../../schemas/task.js";

describe("buildContextPacket", () => {
  it("includes dependency titles and AI fields when present", () => {
    const dep: Task = {
      id: "2",
      title: "Dep task",
      description: "",
      status: "todo",
      type: "chore",
      labels: [],
      depends_on: [],
      blocks: [],
      refs: [],
      created_at: "2026-04-10T10:00:00.000Z",
      updated_at: "2026-04-10T10:00:00.000Z",
    };
    const task: Task = {
      id: "1",
      title: "Main",
      description: "Body",
      status: "in_progress",
      type: "feature",
      priority: "p1",
      labels: [],
      depends_on: ["2"],
      blocks: [],
      refs: [{ type: "file", path: "src/x.ts" }],
      ai: {
        summary: "Short",
        implementation_context: ["note"],
        constraints: ["c1"],
        acceptance_criteria: ["done when"],
        test_strategy: ["unit"],
      },
      created_at: "2026-04-10T10:00:00.000Z",
      updated_at: "2026-04-10T10:00:00.000Z",
    };

    const packet = buildContextPacket(task, [task, dep]);
    expect(packet.id).toBe("1");
    expect(packet.goal).toBe("Short");
    expect(packet.depends_on_titles).toEqual({ "2": "Dep task" });
    expect(packet.implementation_context).toEqual(["note"]);
    expect(packet.constraints).toEqual(["c1"]);
    expect(packet.definition_of_done).toEqual(["done when"]);
    expect(packet.test_strategy).toEqual(["unit"]);
    expect(packet.refs).toEqual([{ type: "file", path: "src/x.ts" }]);
  });
});
