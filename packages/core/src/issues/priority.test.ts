import { describe, expect, it } from "vitest";
import { compareByPriority, priorityFromLabelNames } from "./priority.js";

describe("priorityFromLabelNames", () => {
  it("maps priority labels", () => {
    expect(priorityFromLabelNames(["bug", "priority:high"])).toBe("high");
    expect(priorityFromLabelNames(["priority:urgent"])).toBe("urgent");
    expect(priorityFromLabelNames(["chore"])).toBe("none");
  });
});

describe("compareByPriority", () => {
  it("orders urgent before low", () => {
    expect(compareByPriority("urgent", "low")).toBeLessThan(0);
  });
});