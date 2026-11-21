export { TRAIL_MCP_PACKAGE } from "./constants.js";
export { TRAIL_MCP_READ_TOOLS, TRAIL_MCP_WRITE_TOOLS, TRAIL_MCP_TOOLS } from "./tool-names.js";
export {
  executeTrailMcpTool,
  type TrailMcpExecutorContext,
  type TrailMcpAddTaskCommentHook,
  type TrailMcpUpdateTaskStatusHook,
} from "./executor.js";
export {
  registerTrailMcpTools,
  registerTrailReadTools,
  registerTrailWriteTools,
} from "./register-tools.js";
export { startTrailMcpHttpServer } from "./http-server.js";
export type { TrailMcpHttpServer, TrailMcpHttpServerOptions } from "./http-server.js";
export {
  MCP_CONNECTION_FILENAME,
  defaultTrailDesktopUserDataDir,
  resolveMcpConnectionFile,
} from "./connection-path.js";
export type { McpConnectionFile } from "./connection-path.js";