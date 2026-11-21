export const TRAIL_MCP_READ_TOOLS = [
  "list_workspaces",
  "list_tasks",
  "get_task",
  "list_decisions",
  "get_decision",
  "search_docs",
  "list_open_pins",
] as const;

import { MCP_WRITE_TOOLS } from "@trail/core";

export const TRAIL_MCP_WRITE_TOOLS = MCP_WRITE_TOOLS;

export const TRAIL_MCP_TOOLS = [
  ...TRAIL_MCP_READ_TOOLS,
  ...TRAIL_MCP_WRITE_TOOLS,
] as const;

export type TrailMcpToolName = (typeof TRAIL_MCP_TOOLS)[number];