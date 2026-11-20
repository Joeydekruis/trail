import { describe, expect, it } from "vitest";
import { labelsForNewIssue } from "./create-labels.js";

describe("labelsForNewIssue", () => {
  it("adds type, priority, and agent-ready labels", () => {
    expect(
      labelsForNewIssue({ type: "feature", priority: "high", agentReady: true }),
    ).toEqual(["feature", "priority:high", "agent-ready"]);
  });

  it("omits agent-ready when false", () => {
    expect(labelsForNewIssue({ type: "bug", priority: "medium" })).toEqual([
      "bug",
      "priority:medium",
    ]);
  });
});