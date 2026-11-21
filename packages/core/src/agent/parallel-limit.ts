export const AGENT_PARALLEL_LIMIT_MESSAGE =
  "Parallel run limit reached. This worktree is queued until a slot opens." as const;

export function canStartAnotherAgentRun(activeRuns: number, maxParallel: number): boolean {
  return activeRuns < maxParallel;
}