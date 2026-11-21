import { startBackgroundSync } from "./background-sync";
import { startPreviewIdleSweep } from "./preview-host";

export function startDeferredServices(): void {
  startBackgroundSync();
  startPreviewIdleSweep();
  if (process.env.TRAIL_LOG_DEFERRED === "1") {
    console.info("[trail] deferred services started (background sync)");
  }
}