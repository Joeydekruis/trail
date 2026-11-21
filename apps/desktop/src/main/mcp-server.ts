import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import type { TrailMcpHttpServer } from "@trail/mcp";
import { MCP_CONNECTION_FILENAME, startTrailMcpHttpServer } from "@trail/mcp";
import {
  getIssueCacheStore,
  getKnowledgeDocStore,
  getPreviewPinStore,
  getWorkspaceStore,
} from "./database";

const MCP_TOKEN_KEY = "mcp_http_token";

let httpServer: TrailMcpHttpServer | null = null;

function stores() {
  return {
    workspaces: getWorkspaceStore(),
    issues: getIssueCacheStore(),
    knowledge: getKnowledgeDocStore(),
    pins: getPreviewPinStore(),
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
  httpServer = await startTrailMcpHttpServer(stores(), token);
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