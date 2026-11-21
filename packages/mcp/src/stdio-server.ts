import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTrailMcpTools } from "./register-tools.js";
import type { McpConnectionFile } from "./connection-path.js";
import { resolveMcpConnectionFile } from "./connection-path.js";
import type { TrailMcpToolName } from "./tool-names.js";

function loadConnection(): McpConnectionFile {
  const path = resolveMcpConnectionFile();
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(
      `Trail Desktop MCP connection file not found (${path}). Launch Trail Desktop first.`,
    );
  }
  const parsed = JSON.parse(raw) as McpConnectionFile;
  if (!parsed.baseUrl || !parsed.token) {
    throw new Error(`Invalid MCP connection file: ${path}`);
  }
  return parsed;
}

async function invokeRemote(
  connection: McpConnectionFile,
  tool: TrailMcpToolName,
  args: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch(`${connection.baseUrl}/tools/${tool}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${connection.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Trail MCP HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<unknown>;
}

export async function runTrailMcpStdioBridge(): Promise<void> {
  const connection = loadConnection();
  const server = new McpServer(
    { name: "trail-desktop", version: "0.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Trail Desktop MCP. Product knowledge and tasks come from the running Trail app (read + limited write).",
    },
  );
  registerTrailMcpTools(server, (tool, args) => {
    return invokeRemote(connection, tool, args);
  });
  const transport = new StdioServerTransport();
  await server.connect(transport);
}