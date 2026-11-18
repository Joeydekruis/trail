export function startDeferredServices(): void {
  if (process.env.TRAIL_LOG_DEFERRED === "1") {
    console.info("[trail] deferred services stub (sync, runner, MCP, updates)");
  }
}