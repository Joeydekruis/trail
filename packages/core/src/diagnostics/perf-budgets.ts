/** Performance briefing — workspace switch (all platforms). */
export const PERF_BUDGET_WORKSPACE_SWITCH_MS = 150;

/**
 * Conservative cold-start budget for CI (Windows laptop target is 2,5 s).
 * M1 target is 1,5 s — tighten locally when profiling on Apple Silicon.
 */
export const PERF_BUDGET_COLD_START_MS = 2_500;

export function withinPerfBudget(actualMs: number, budgetMs: number): boolean {
  return actualMs >= 0 && actualMs <= budgetMs;
}