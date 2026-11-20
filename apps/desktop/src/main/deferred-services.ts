import { startBackgroundSync } from "./background-sync";

export function startDeferredServices(): void {
  startBackgroundSync();
  if (process.env.TRAIL_LOG_DEFERRED === "1") {
    console.info("[trail] deferred services started (background sync)");
  }
}