import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { TrailMcpExecutorContext, TrailMcpHttpServer } from "@trail/mcp";
import {
  MCP_CONNECTION_FILENAME,
  startTrailMcpHttpServer,
  TRAIL_MCP_STREAMABLE_PATH,
} from "@trail/mcp";
import { moveBoardIssue } from "./board-move-issue";
import { mcpAddTaskComment } from "./mcp-github-hooks";
import {
  getDecisionStore,
  getIssueCacheStore,
  getKnowledgeDocStore,
  getPreviewPinStore,
  getWorktreeStore,
  getWorkspaceStore,
} from "./database";
import { runAutopilotTick } from "./autopilot-service";
import { startAgentRun } from "./agent-run";

const MCP_TOKEN_KEY = "mcp_http_token";

let httpServer: TrailMcpHttpServer | null = null;

function stores() {
  return {
    workspaces: getWorkspaceStore(),
    issues: getIssueCacheStore(),
    knowledge: getKnowledgeDocStore(),
    decisions: getDecisionStore(),
    worktrees: getWorktreeStore(),
    pins: getPreviewPinStore(),
  };
}

function mcpExecutorContext(): TrailMcpExecutorContext {
  return {
    stores: stores(),
    updateTaskStatus: async ({ workspaceId, issueNumber, boardColumn }) => {
      const move = await moveBoardIssue({
        workspaces: getWorkspaceStore(),
        issues: getIssueCacheStore(),
        workspaceId,
        issueNumber,
        targetColumn: boardColumn,
      });
      if (!move.ok) {
        return { ok: false as const, message: move.message };
      }
      const task = getIssueCacheStore().get(workspaceId, issueNumber);
      return {
        ok: true as const,
        issueNumber,
        boardColumn,
        state: task?.state ?? "open",
        title: task?.title ?? "",
      };
    },
    addTaskComment: async ({ workspaceId, issueNumber, body }) => {
      return mcpAddTaskComment({ workspaceId, issueNumber, body });
    },
    startAgentRun: async ({ workspaceId, issueNumber, prompt }) => {
      const result = await startAgentRun({ workspaceId, issueNumber, prompt });
      if (!result.ok) {
        return { ok: false as const, message: result.message };
      }
      return { ok: true as const, workspaceId, issueNumber, state: "running" as const };
    },
  };
}

function tokenForMcp(): string {
  const workspaces = getWorkspaceStore();
  const existing = workspaces.getAppSetting(MCP_TOKEN_KEY);
  if (existing?.trim()) {
    return existing.trim();
  }
  const token = randomBytes(24).toString("hex");
  workspaces.setAppSetting(MCP_TOKEN_KEY, token);
  return token;
}

export function writeMcpConnectionFile(baseUrl: string, token: string): string {
  const path = join(app.getPath("userData"), MCP_CONNECTION_FILENAME);
  writeFileSync(
    path,
    JSON.stringify(
      {
        baseUrl,
        streamableUrl: `${baseUrl}${TRAIL_MCP_STREAMABLE_PATH}`,
        token,
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );
  return path;
}

export async function startMcpServer(): Promise<void> {
  if (httpServer) {
    return;
  }
  const token = tokenForMcp();
  httpServer = await startTrailMcpHttpServer(mcpExecutorContext(), token, {
    onToolSuccess: (tool, result) => {
      if (tool !== "create_decision") {
        return;
      }
      if (
        result &&
        typeof result === "object" &&
        "ok" in result &&
        (result as { ok: boolean }).ok
      ) {
        void runAutopilotTick();
      }
    },
  });
  const connectionFile = writeMcpConnectionFile(httpServer.baseUrl, token);
  if (process.env.TRAIL_LOG_DEFERRED === "1") {
    console.info("[trail] MCP HTTP listening", httpServer.baseUrl, connectionFile);
  }
}

export function getMcpConnectionSnapshot(): {
  running: boolean;
  baseUrl: string | null;
  token: string | null;
  connectionFile: string;
} {
  const connectionFile = join(app.getPath("userData"), MCP_CONNECTION_FILENAME);
  if (!httpServer) {
    return { running: false, baseUrl: null, token: null, connectionFile };
  }
  return {
    running: true,
    baseUrl: httpServer.baseUrl,
    token: httpServer.token,
    connectionFile,
  };
}

export async function stopMcpServer(): Promise<void> {
  if (!httpServer) {
    return;
  }
  await httpServer.close();
  httpServer = null;
}