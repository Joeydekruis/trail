import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { executeTrailMcpTool, type TrailMcpExecutorContext } from "./executor.js";
import type { TrailMcpToolName } from "./tool-names.js";
import { registerTrailMcpTools } from "./register-tools.js";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** MCP Streamable HTTP (stateless) — one request/response per connection. */
export async function handleStreamableMcpRequest(
  context: TrailMcpExecutorContext,
  req: IncomingMessage,
  res: ServerResponse,
  options?: {
    onToolSuccess?: (tool: TrailMcpToolName, result: unknown) => void;
  },
): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = new McpServer(
    { name: "trail-desktop", version: "0.0.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Trail Desktop MCP. Product knowledge and tasks come from the running Trail app (read + limited write).",
    },
  );
  registerTrailMcpTools(server, (tool, args) => {
    const name = tool as TrailMcpToolName;
    return executeTrailMcpTool(context, name, args).then((result) => {
      options?.onToolSuccess?.(name, result);
      return result;
    });
  });
  await server.connect(transport);
  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  let parsedBody: unknown;
  if (req.method === "POST") {
    const raw = await readBody(req);
    if (raw.trim()) {
      try {
        parsedBody = JSON.parse(raw) as unknown;
      } catch {
        res.statusCode = 400;
        res.end("Invalid JSON body");
        return;
      }
    }
  }

  await transport.handleRequest(req, res, parsedBody);
}