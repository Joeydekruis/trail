import { describe, expect, it } from "vitest";
import {
  PERF_BUDGET_COLD_START_MS,
  PERF_BUDGET_WORKSPACE_SWITCH_MS,
  withinPerfBudget,
} from "./perf-budgets.js";

describe("withinPerfBudget", () => {
  it("accepts timings within workspace budget", () => {
    expect(withinPerfBudget(120, PERF_BUDGET_WORKSPACE_SWITCH_MS)).toBe(true);
    expect(withinPerfBudget(151, PERF_BUDGET_WORKSPACE_SWITCH_MS)).toBe(false);
  });

  it("accepts timings within cold-start budget", () => {
    expect(withinPerfBudget(2_400, PERF_BUDGET_COLD_START_MS)).toBe(true);
    expect(withinPerfBudget(2_501, PERF_BUDGET_COLD_START_MS)).toBe(false);
  });
});