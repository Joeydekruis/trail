import { describe, expect, it } from "vitest";

import {
  composeIssueBody,
  metaFromTask,
  parseIssueBody,
  priorityFromLabels,
  stripTrailManagedLabels,
} from "./issue-body.js";
import type { Task } from "../schemas/task.js";

const baseTask: Task = {
  id: "1",
  title: "T",
  description: "Human readable text",
  status: "in_progress",
  type: "bug",
  priority: "p1",
  estimate: "md",
  labels: ["enhancement"],
  depends_on: ["2"],
  blocks: [],
  refs: [{ type: "doc", path: "docs/a.md" }],
  created_at: "2026-04-01T10:00:00.000Z",
  updated_at: "2026-04-01T10:00:00.000Z",
};

describe("issue-body", () => {
  it("round-trips description and meta through compose and parse", () => {
    const meta = metaFromTask(baseTask);
    const body = composeIssueBody("Hello **world**", meta);
    const parsed = parseIssueBody(body);

    expect(parsed.description).toBe("Hello **world**");
    expect(parsed.meta.type).toBe("bug");
    expect(parsed.meta.priority).toBe("p1");
    expect(parsed.meta.estimate).toBe("md");
    expect(parsed.meta.status).toBe("in_progress");
    expect(parsed.meta.depends_on).toEqual(["2"]);
    expect(parsed.meta.refs).toEqual([{ type: "doc", path: "docs/a.md" }]);
  });

  it("returns full string as description when no meta block", () => {
    expect(parseIssueBody("Plain issue body").description).toBe("Plain issue body");
    expect(parseIssueBody("Plain issue body").meta).toEqual({});
  });

  it("parses priority from labels", () => {
    expect(priorityFromLabels(["enhancement", "priority:p2"])).toBe("p2");
    expect(stripTrailManagedLabels(["enhancement", "priority:p2"])).toEqual([
      "enhancement",
    ]);
  });
});
