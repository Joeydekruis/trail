import type { TrailMcpStores } from "@trail/core";
import {
  mcpCreateDecision,
  mcpGetDecision,
  mcpGetTask,
  mcpListDecisions,
  mcpListOpenPins,
  mcpListTasks,
  mcpListWorkspaces,
  mcpSearchDocs,
} from "@trail/core";
import type { TrailMcpToolName } from "./tool-names.js";

export type TrailMcpToolArgs = Record<string, unknown>;

export function executeTrailMcpTool(
  stores: TrailMcpStores,
  tool: TrailMcpToolName,
  args: TrailMcpToolArgs,
): unknown {
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
    default: {
      const _exhaustive: never = tool;
      throw new Error(`Unknown tool: ${String(_exhaustive)}`);
    }
  }
}