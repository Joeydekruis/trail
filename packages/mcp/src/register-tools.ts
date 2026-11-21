import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { TrailMcpToolName } from "./tool-names.js";

function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

function err(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export function registerTrailReadTools(
  server: McpServer,
  invoke: (
    tool: TrailMcpToolName,
    args: Record<string, unknown>,
  ) => unknown | Promise<unknown>,
): void {
  const workspaceId = z.string().optional();

  server.registerTool(
    "list_workspaces",
    { description: "List Trail workspaces (GitHub-linked PM spaces).", inputSchema: z.object({}) },
    async () => {
      try {
        return ok(await Promise.resolve(invoke("list_workspaces", {})));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "list_tasks",
    {
      description: "List cached GitHub issues/tasks for a workspace (defaults to active).",
      inputSchema: z.object({ workspaceId }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("list_tasks", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "get_task",
    {
      description: "Load one task by issue number or id (#42).",
      inputSchema: z.object({
        workspaceId,
        number: z.number().int().positive().optional(),
        id: z.string().optional(),
      }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("get_task", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "list_decisions",
    {
      description: "List ADR-style decisions stored in Trail knowledge.",
      inputSchema: z.object({ workspaceId }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("list_decisions", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "get_decision",
    {
      description: "Load decision by ADR id (e.g. ADR-001) or knowledge slug.",
      inputSchema: z.object({ workspaceId, id: z.string().min(1) }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("get_decision", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "search_docs",
    {
      description: "Full-text search across Trail knowledge docs (SQLite).",
      inputSchema: z.object({
        workspaceId,
        query: z.string().min(1),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("search_docs", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "list_open_pins",
    {
      description: "List preview pins for a workspace (optional issue filter).",
      inputSchema: z.object({
        workspaceId,
        issueNumber: z.number().int().positive().optional(),
      }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("list_open_pins", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );
}

export function registerTrailWriteTools(
  server: McpServer,
  invoke: (
    tool: TrailMcpToolName,
    args: Record<string, unknown>,
  ) => unknown | Promise<unknown>,
): void {
  const workspaceId = z.string().optional();
  const decisionStatus = z.enum(["proposed", "accepted"]).optional();

  server.registerTool(
    "create_decision",
    {
      description:
        "Create an ADR in Trail SQLite. Checks title/id conflicts; proposed decisions can block an issue (worktree waiting).",
      inputSchema: z.object({
        workspaceId,
        adrId: z.string().optional(),
        title: z.string().min(1).max(200),
        contextMarkdown: z.string().min(1).max(50_000),
        decisionMarkdown: z.string().min(1).max(50_000),
        consequencesMarkdown: z.string().max(50_000).optional(),
        status: decisionStatus,
        blocksIssueNumber: z.number().int().positive().optional(),
        author: z.string().max(120).optional(),
        allowSimilarTitle: z.boolean().optional(),
      }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("create_decision", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );

  server.registerTool(
    "update_task_status",
    {
      description:
        "Move a GitHub issue on the board (Projects v2 status when linked). Updates GitHub when connected.",
      inputSchema: z.object({
        workspaceId,
        number: z.number().int().positive().optional(),
        id: z.string().optional(),
        boardColumn: z.string().optional(),
        status: z.string().optional(),
      }),
    },
    async (args) => {
      try {
        return ok(await Promise.resolve(invoke("update_task_status", args)));
      } catch (e) {
        return err(e instanceof Error ? e.message : String(e));
      }
    },
  );
}

export function registerTrailMcpTools(
  server: McpServer,
  invoke: (
    tool: TrailMcpToolName,
    args: Record<string, unknown>,
  ) => unknown | Promise<unknown>,
): void {
  registerTrailReadTools(server, invoke);
  registerTrailWriteTools(server, invoke);
}