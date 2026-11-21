import type { BoardColumnId, TrailMcpStores } from "@trail/core";
import {
  mcpCreateDecision,
  mcpGetDecision,
  mcpGetTask,
  mcpListDecisions,
  mcpListOpenPins,
  mcpListTasks,
  mcpListWorkspaces,
  mcpResolvePin,
  mcpSearchDocs,
  assertMcpToolAllowed,
  resolveMcpAddTaskComment,
  resolveMcpStartAgentRun,
  resolveMcpUpdateTaskStatus,
} from "@trail/core";
import type { TrailMcpToolName } from "./tool-names.js";

export type TrailMcpToolArgs = Record<string, unknown>;

export type TrailMcpUpdateTaskStatusHook = (input: {
  workspaceId: string;
  issueNumber: number;
  boardColumn: BoardColumnId;
}) => Promise<unknown>;

export type TrailMcpAddTaskCommentHook = (input: {
  workspaceId: string;
  issueNumber: number;
  body: string;
}) => Promise<unknown>;

export type TrailMcpStartAgentRunHook = (input: {
  workspaceId: string;
  issueNumber: number;
  prompt: string;
}) => Promise<unknown>;

export type TrailMcpExecutorContext = {
  stores: TrailMcpStores;
  updateTaskStatus?: TrailMcpUpdateTaskStatusHook;
  addTaskComment?: TrailMcpAddTaskCommentHook;
  startAgentRun?: TrailMcpStartAgentRunHook;
};

export async function executeTrailMcpTool(
  context: TrailMcpExecutorContext,
  tool: TrailMcpToolName,
  args: TrailMcpToolArgs,
): Promise<unknown> {
  const { stores } = context;
  const workspaceArg =
    typeof args.workspaceId === "string" ? args.workspaceId : undefined;
  const gate = assertMcpToolAllowed(stores.workspaces, tool, workspaceArg);
  if (!gate.ok) {
    return gate;
  }
  switch (tool) {
    case "list_workspaces":
      return mcpListWorkspaces(stores);
    case "list_tasks":
      return mcpListTasks(stores, typeof args.workspaceId === "string" ? args.workspaceId : undefined);
    case "get_task":
      return mcpGetTask(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        number: typeof args.number === "number" ? args.number : undefined,
        id: typeof args.id === "string" ? args.id : undefined,
      });
    case "list_decisions":
      return mcpListDecisions(
        stores,
        typeof args.workspaceId === "string" ? args.workspaceId : undefined,
      );
    case "get_decision":
      if (typeof args.id !== "string" || !args.id.trim()) {
        throw new Error("get_decision requires id");
      }
      return mcpGetDecision(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        id: args.id,
      });
    case "search_docs":
      if (typeof args.query !== "string") {
        throw new Error("search_docs requires query");
      }
      return mcpSearchDocs(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        query: args.query,
        limit: typeof args.limit === "number" ? args.limit : undefined,
      });
    case "list_open_pins":
      return mcpListOpenPins(
        stores,
        typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        typeof args.issueNumber === "number" ? args.issueNumber : undefined,
      );
    case "create_decision": {
      if (typeof args.title !== "string") {
        throw new Error("create_decision requires title");
      }
      if (typeof args.contextMarkdown !== "string" || typeof args.decisionMarkdown !== "string") {
        throw new Error("create_decision requires contextMarkdown and decisionMarkdown");
      }
      const status =
        args.status === "proposed" || args.status === "accepted" ? args.status : undefined;
      return mcpCreateDecision(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        adrId: typeof args.adrId === "string" ? args.adrId : undefined,
        title: args.title,
        contextMarkdown: args.contextMarkdown,
        decisionMarkdown: args.decisionMarkdown,
        consequencesMarkdown:
          typeof args.consequencesMarkdown === "string" ? args.consequencesMarkdown : undefined,
        status,
        blocksIssueNumber:
          typeof args.blocksIssueNumber === "number" ? args.blocksIssueNumber : undefined,
        author: typeof args.author === "string" ? args.author : undefined,
        allowSimilarTitle: args.allowSimilarTitle === true,
      });
    }
    case "update_task_status": {
      const resolved = resolveMcpUpdateTaskStatus(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        number: typeof args.number === "number" ? args.number : undefined,
        id: typeof args.id === "string" ? args.id : undefined,
        boardColumn: typeof args.boardColumn === "string" ? args.boardColumn : undefined,
        status: typeof args.status === "string" ? args.status : undefined,
      });
      if (!resolved.ok) {
        return resolved;
      }
      if (!context.updateTaskStatus) {
        return {
          ok: false,
          code: "unavailable",
          message: "update_task_status is only available in Trail Desktop",
        };
      }
      return context.updateTaskStatus({
        workspaceId: resolved.workspaceId,
        issueNumber: resolved.issueNumber,
        boardColumn: resolved.boardColumn,
      });
    }
    case "resolve_pin":
      return mcpResolvePin(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        pinId: typeof args.pinId === "number" ? args.pinId : undefined,
        issueNumber: typeof args.issueNumber === "number" ? args.issueNumber : undefined,
        pinNumber: typeof args.pinNumber === "number" ? args.pinNumber : undefined,
      });
    case "add_task_comment": {
      if (typeof args.body !== "string") {
        throw new Error("add_task_comment requires body");
      }
      const resolved = resolveMcpAddTaskComment(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        number: typeof args.number === "number" ? args.number : undefined,
        id: typeof args.id === "string" ? args.id : undefined,
        body: args.body,
      });
      if (!resolved.ok) {
        return resolved;
      }
      if (!context.addTaskComment) {
        return {
          ok: false,
          code: "unavailable",
          message: "add_task_comment is only available in Trail Desktop",
        };
      }
      return context.addTaskComment({
        workspaceId: resolved.workspaceId,
        issueNumber: resolved.issueNumber,
        body: args.body.trim(),
      });
    }
    case "start_agent_run": {
      const resolved = resolveMcpStartAgentRun(stores, {
        workspaceId: typeof args.workspaceId === "string" ? args.workspaceId : undefined,
        number: typeof args.number === "number" ? args.number : undefined,
        id: typeof args.id === "string" ? args.id : undefined,
        prompt: typeof args.prompt === "string" ? args.prompt : undefined,
      });
      if (!resolved.ok) {
        return resolved;
      }
      if (!context.startAgentRun) {
        return {
          ok: false,
          code: "unavailable",
          message: "start_agent_run is only available in Trail Desktop",
        };
      }
      return context.startAgentRun({
        workspaceId: resolved.workspaceId,
        issueNumber: resolved.issueNumber,
        prompt: resolved.prompt,
      });
    }
    default: {
      const _exhaustive: never = tool;
      throw new Error(`Unknown tool: ${String(_exhaustive)}`);
    }
  }
}