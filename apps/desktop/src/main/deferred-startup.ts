/**
 * Phase 1: defer GitHub sync, runner, MCP, and update checks until after first paint.
 */
export function scheduleDeferredStartup(): void {
  const delayMs = 2_500;
  setTimeout(() => {
    void import("./deferred-services").then((mod) => mod.startDeferredServices());
  }, delayMs);
}