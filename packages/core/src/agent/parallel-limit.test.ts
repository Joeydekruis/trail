import { describe, expect, it } from "vitest";
import { canStartAnotherAgentRun } from "./parallel-limit.js";

describe("canStartAnotherAgentRun", () => {
  it("allows starts below the cap", () => {
    expect(canStartAnotherAgentRun(0, 2)).toBe(true);
    expect(canStartAnotherAgentRun(1, 2)).toBe(true);
  });

  it("blocks at the cap", () => {
    expect(canStartAnotherAgentRun(2, 2)).toBe(false);
  });
});