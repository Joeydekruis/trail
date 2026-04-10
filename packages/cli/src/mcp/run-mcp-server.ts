import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getCliFailureMessage } from "../cli/run-cli.js";
import { buildContextPacket } from "../cli/commands/context.js";
import { selectTasksForList, type ListOptions } from "../cli/commands/list.js";
import { loadTrailReadContext } from "../cli/read-context.js";
import { compileSnapshot, DEPENDENCY_CYCLE } from "../core/compile-snapshot.js";
import { listDependencyEdges } from "../core/deps.js";
import { selectNextTask } from "../core/next-task.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function readCliVersion(): string {
  const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
  return pkg.version ?? "0.0.0";
}

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

function catchToResult(e: unknown): CallToolResult {
  return err(getCliFailureMessage(e));
}

/**
 * MCP stdio server: exposes read-oriented Trail operations as tools for agents.
 */
export async function runMcpServer(): Promise<void> {
  const server = new McpServer(
    { name: "trail", version: readCliVersion() },
    {
      capabilities: { tools: {} },
      instructions:
        "Trail task tools use the current working directory as the Trail repo root. Run from your git repository.",
    },
  );

  server.registerTool(
    "trail_list",
    {
      description:
        "List Trail tasks (same filters as `trail list`). Returns slim task rows.",
      inputSchema: {
        all: z.boolean().optional(),
        limit: z.number().int().nonnegative().optional(),
        status: z.string().optional(),
        label: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        const opts: ListOptions = {
          all: args.all,
          limit: args.limit,
          status: args.status,
          label: args.label,
        };
        const rows = selectTasksForList(tasks, opts);
        const slim = rows.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          labels: t.labels,
        }));
        return ok(slim);
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  server.registerTool(
    "trail_show",
    {
      description: "Load one Trail task by id (full validated task JSON).",
      inputSchema: { id: z.string() },
    },
    async (args) => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        const task = tasks.find((t) => t.id === args.id);
        if (task === undefined) {
          return err(`No task with id "${args.id}"`);
        }
        return ok(task);
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  server.registerTool(
    "trail_next",
    {
      description:
        "Return the next actionable task (`trail next`), or null if none.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        return ok(selectNextTask(tasks));
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  server.registerTool(
    "trail_context",
    {
      description:
        "Compact context packet for a task id (dependencies, AI fields, refs).",
      inputSchema: { id: z.string() },
    },
    async (args) => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        const task = tasks.find((t) => t.id === args.id);
        if (task === undefined) {
          return err(`No task with id "${args.id}"`);
        }
        return ok(buildContextPacket(task, tasks));
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  server.registerTool(
    "trail_graph",
    {
      description: "List dependency edges `{ from, to }` (from depends on to).",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        return ok(listDependencyEdges(tasks));
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  server.registerTool(
    "trail_validate",
    {
      description:
        "Compile the task graph and return warnings; `hasDependencyCycle` is true if any cycle.",
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const { tasks } = await loadTrailReadContext(process.cwd());
        const snapshot = compileSnapshot(tasks);
        const hasDependencyCycle = snapshot.warnings.some((w) => w.code === DEPENDENCY_CYCLE);
        return ok({
          warnings: snapshot.warnings,
          hasDependencyCycle,
        });
      } catch (e) {
        return catchToResult(e);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
