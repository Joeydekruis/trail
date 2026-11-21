import { startBackgroundSync } from "./background-sync";
import { startPreviewIdleSweep } from "./preview-host";
import { startAutopilotScheduler } from "./autopilot-service";
import { startMcpServer } from "./mcp-server";

export function startDeferredServices(): void {
  startBackgroundSync();
  startPreviewIdleSweep();
  void startMcpServer().catch((error) => {
    console.warn("[trail] MCP server failed to start:", error);
  });
  startAutopilotScheduler();
  if (process.env.TRAIL_LOG_DEFERRED === "1") {
    console.info("[trail] deferred services started (background sync)");
  }
}