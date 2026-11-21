import { createServer, type Server } from "node:http";
import { executeTrailMcpTool, type TrailMcpExecutorContext } from "./executor.js";
import type { TrailMcpToolName } from "./tool-names.js";
import { TRAIL_MCP_TOOLS } from "./tool-names.js";

export type TrailMcpHttpServer = {
  server: Server;
  port: number;
  baseUrl: string;
  token: string;
  close: () => Promise<void>;
};

function readBody(req: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isToolName(value: string): value is TrailMcpToolName {
  return (TRAIL_MCP_TOOLS as readonly string[]).includes(value);
}

export type TrailMcpHttpServerOptions = {
  onToolSuccess?: (tool: TrailMcpToolName, result: unknown) => void;
};

export function startTrailMcpHttpServer(
  context: TrailMcpExecutorContext,
  token: string,
  options?: TrailMcpHttpServerOptions,
): Promise<TrailMcpHttpServer> {
  const server = createServer((req, res) => {
    void (async () => {
      if (req.method !== "POST" || !req.url?.startsWith("/tools/")) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      const auth = req.headers.authorization ?? "";
      const expected = `Bearer ${token}`;
      if (auth !== expected) {
        res.statusCode = 401;
        res.end("Unauthorized");
        return;
      }
      const toolSegment = req.url.slice("/tools/".length).split("?")[0] ?? "";
      if (!isToolName(toolSegment)) {
        res.statusCode = 404;
        res.end("Unknown tool");
        return;
      }
      let args: Record<string, unknown> = {};
      try {
        const raw = await readBody(req);
        if (raw.trim()) {
          const parsed = JSON.parse(raw) as unknown;
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            args = parsed as Record<string, unknown>;
          }
        }
        const result = await executeTrailMcpTool(context, toolSegment, args);
        options?.onToolSuccess?.(toolSegment, result);
        res.setHeader("content-type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(result));
      } catch (error) {
        res.setHeader("content-type", "application/json");
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    })();
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to bind MCP HTTP server"));
        return;
      }
      const baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve({
        server,
        port: addr.port,
        baseUrl,
        token,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((err) => (err ? closeReject(err) : closeResolve()));
          }),
      });
    });
  });
}