import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { trailPaths, type TrailPaths } from "../../cli/src/core/paths.js";
import {
  loadAllTasks,
  findTaskFileById,
  writeTaskFile,
} from "../../cli/src/core/task-store.js";
import { rebuildSnapshot } from "../../cli/src/core/rebuild-snapshot.js";
import { generateDraftId } from "../../cli/src/core/draft-id.js";
import { TaskSchema, type Task } from "../../cli/src/schemas/task.js";
import { TrailConfigSchema } from "../../cli/src/schemas/config.js";

export function createApi(root: string): Hono {
  const app = new Hono();
  const paths: TrailPaths = trailPaths(root);

  app.use("/api/*", cors());

  // ── GET /api/tasks ────────────────────────────────────────────────
  app.get("/api/tasks", (c) => {
    const tasks = loadAllTasks(paths.tasksDir);
    return c.json({ tasks });
  });

  // ── GET /api/tasks/:id ────────────────────────────────────────────
  app.get("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ task: result.task });
  });

  // ── POST /api/tasks ───────────────────────────────────────────────
  app.post("/api/tasks", async (c) => {
    const body = await c.req.json();
    const now = new Date().toISOString();
    const id = generateDraftId();

    const raw: Record<string, unknown> = {
      id,
      title: body.title,
      status: body.status ?? "draft",
      type: body.type ?? "feature",
      labels: body.labels ?? [],
      depends_on: body.depends_on ?? [],
      blocks: body.blocks ?? [],
      refs: body.refs ?? [],
      created_at: now,
      updated_at: now,
    };

    if (body.description !== undefined) raw.description = body.description;
    if (body.priority !== undefined) raw.priority = body.priority;
    if (body.assignee !== undefined) raw.assignee = body.assignee;
    if (body.milestone !== undefined) raw.milestone = body.milestone;
    if (body.estimate !== undefined) raw.estimate = body.estimate;

    const parsed = TaskSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        400,
      );
    }

    const filePath = path.join(paths.tasksDir, `${id}.json`);
    writeTaskFile(filePath, parsed.data);
    rebuildSnapshot(paths);

    return c.json({ task: parsed.data }, 201);
  });

  // ── PATCH /api/tasks/:id ──────────────────────────────────────────
  app.patch("/api/tasks/:id", async (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }

    const body = await c.req.json();
    const merged: Record<string, unknown> = {
      ...result.task,
      ...body,
      id: result.task.id,
      created_at: result.task.created_at,
      updated_at: new Date().toISOString(),
    };

    const parsed = TaskSchema.safeParse(merged);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        400,
      );
    }

    writeTaskFile(result.filePath, parsed.data);
    rebuildSnapshot(paths);

    return c.json({ task: parsed.data });
  });

  // ── DELETE /api/tasks/:id ─────────────────────────────────────────
  app.delete("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }

    fs.unlinkSync(result.filePath);
    rebuildSnapshot(paths);

    return c.json({ deleted: true });
  });

  // ── GET /api/config ───────────────────────────────────────────────
  app.get("/api/config", (c) => {
    try {
      const raw = JSON.parse(fs.readFileSync(paths.configPath, "utf8"));
      const parsed = TrailConfigSchema.safeParse(raw);
      if (!parsed.success) {
        return c.json(
          { error: "Invalid config", issues: parsed.error.issues },
          500,
        );
      }
      return c.json({ config: parsed.data });
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
  });

  return app;
}
