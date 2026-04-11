// server/start.ts
import { existsSync } from "fs";
import path2 from "path";
import { fileURLToPath } from "url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { findTrailRoot } from "@trail-pm/cli/lib";

// server/api.ts
import fs from "fs";
import path from "path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  trailPaths,
  loadAllTasks,
  findTaskFileById,
  writeTaskFile,
  rebuildSnapshot,
  generateDraftId,
  TaskSchema,
  TrailConfigSchema
} from "@trail-pm/cli/lib";
function createApi(root2) {
  const app2 = new Hono();
  const paths = trailPaths(root2);
  app2.use("/api/*", cors());
  app2.get("/api/tasks", (c) => {
    const tasks = loadAllTasks(paths.tasksDir);
    return c.json({ tasks });
  });
  app2.get("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ task: result.task });
  });
  app2.post("/api/tasks", async (c) => {
    const body = await c.req.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const id = generateDraftId();
    const raw = {
      id,
      title: body.title,
      status: body.status ?? "draft",
      type: body.type ?? "feature",
      labels: body.labels ?? [],
      depends_on: body.depends_on ?? [],
      blocks: body.blocks ?? [],
      refs: body.refs ?? [],
      created_at: now,
      updated_at: now
    };
    if (body.description !== void 0) raw.description = body.description;
    if (body.priority !== void 0) raw.priority = body.priority;
    if (body.assignee !== void 0) raw.assignee = body.assignee;
    if (body.milestone !== void 0) raw.milestone = body.milestone;
    if (body.estimate !== void 0) raw.estimate = body.estimate;
    const parsed = TaskSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        400
      );
    }
    const filePath = path.join(paths.tasksDir, `${id}.json`);
    writeTaskFile(filePath, parsed.data);
    rebuildSnapshot(paths);
    return c.json({ task: parsed.data }, 201);
  });
  app2.patch("/api/tasks/:id", async (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    const body = await c.req.json();
    const merged = {
      ...result.task,
      ...body,
      id: result.task.id,
      created_at: result.task.created_at,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    const parsed = TaskSchema.safeParse(merged);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        400
      );
    }
    writeTaskFile(result.filePath, parsed.data);
    rebuildSnapshot(paths);
    return c.json({ task: parsed.data });
  });
  app2.delete("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    fs.unlinkSync(result.filePath);
    rebuildSnapshot(paths);
    return c.json({ deleted: true });
  });
  app2.get("/api/config", (c) => {
    try {
      const raw = JSON.parse(fs.readFileSync(paths.configPath, "utf8"));
      const parsed = TrailConfigSchema.safeParse(raw);
      if (!parsed.success) {
        return c.json(
          { error: "Invalid config", issues: parsed.error.issues },
          500
        );
      }
      return c.json({ config: parsed.data });
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
  });
  return app2;
}

// server/start.ts
var __dirname = path2.dirname(fileURLToPath(import.meta.url));
var distDir = path2.resolve(__dirname, "..", "dist");
function buildApp(trailRoot, hasClient2) {
  const app2 = createApi(trailRoot);
  if (hasClient2) {
    app2.use("/*", async (c, next) => {
      if (c.req.path.startsWith("/api")) {
        return next();
      }
      return serveStatic({
        root: distDir,
        rewriteRequestPath: (reqPath) => {
          if (reqPath === "/" || reqPath === "") {
            return "/index.html";
          }
          if (reqPath.includes(".") && !reqPath.endsWith("/")) {
            return reqPath;
          }
          return "/index.html";
        }
      })(c, next);
    });
  }
  return app2;
}
var root = findTrailRoot(process.cwd());
if (!root) {
  console.error("Not a Trail repository. Run `trail init` first.");
  process.exit(1);
}
var hasClient = existsSync(path2.join(distDir, "index.html"));
var app = buildApp(root, hasClient);
var port = Number(process.env.TRAIL_UI_PORT ?? process.env.TRAIL_API_PORT) || 4700;
serve({ fetch: app.fetch, port }, (info) => {
  if (hasClient) {
    console.log(`Trail UI + API at http://localhost:${info.port}`);
  } else {
    console.log(
      `Trail API at http://localhost:${info.port} (build the client with npm run build, or use npm run dev:all)`
    );
  }
});
//# sourceMappingURL=start.js.map