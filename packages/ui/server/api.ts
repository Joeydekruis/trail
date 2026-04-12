import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";

import {
  trailPaths,
  type TrailPaths,
  loadAllTasks,
  findTaskFileById,
  writeTaskFile,
  rebuildSnapshot,
  generateDraftId,
  TaskSchema,
  TrailConfigSchema,
  type Task,
  resolveGitHubToken,
  GitHubClient,
  taskToIssueUpdate,
  fullSync,
  writeLastFullSyncAt,
  linkDraftToNewGitHubIssue,
} from "@trail-pm/cli/lib";

function isPathInsideRepo(repoRoot: string, absolutePath: string): boolean {
  const root = path.resolve(repoRoot);
  const candidate = path.resolve(absolutePath);
  const rel = path.relative(root, candidate);
  return rel !== "" && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}

function resolveSafeRepoPath(repoRoot: string, rel: string): string | null {
  const trimmed = rel.trim().replace(/^\/+/, "");
  if (trimmed === "" || trimmed.includes("\0")) {
    return null;
  }
  const normalized = path.normalize(trimmed);
  if (normalized.startsWith(`..${path.sep}`) || normalized === "..") {
    return null;
  }
  const full = path.resolve(repoRoot, normalized);
  if (!isPathInsideRepo(repoRoot, full)) {
    return null;
  }
  return full;
}

function isLinkedTask(
  task: Task,
): task is Task & { github: NonNullable<Task["github"]> } {
  return task.github != null && typeof task.github === "object";
}

export function createApi(root: string): Hono {
  const app = new Hono();
  const paths: TrailPaths = trailPaths(root);

  app.use("/api/*", cors());

  function readConfig() {
    const raw = fs.readFileSync(paths.configPath, "utf8");
    return TrailConfigSchema.parse(JSON.parse(raw));
  }

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
    const now = new Date();
    const nowIso = now.toISOString();
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
      created_at: nowIso,
      updated_at: nowIso,
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

    const draftPath = path.join(paths.tasksDir, `${id}.json`);
    writeTaskFile(draftPath, parsed.data);

    const config = readConfig();
    if (config.sync.preset === "collaborative") {
      const tokenResult = resolveGitHubToken();
      if (!tokenResult.ok) {
        rebuildSnapshot(paths);
        return c.json(
          {
            task: parsed.data,
            warning:
              "Task saved locally only: set GITHUB_TOKEN or run `gh auth login` to create the GitHub issue in collaborative mode.",
          },
          201,
        );
      }
      const client = new GitHubClient(tokenResult.token);
      const { owner, repo } = config.github;
      const promoted = await linkDraftToNewGitHubIssue({
        client,
        owner,
        repo,
        draft: parsed.data,
        draftFilePath: draftPath,
        tasksDir: paths.tasksDir,
        now,
      });
      rebuildSnapshot(paths, now);
      return c.json({ task: promoted }, 201);
    }

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

    let task = parsed.data;
    writeTaskFile(result.filePath, task);

    const config = readConfig();
    if (config.sync.preset === "collaborative" && isLinkedTask(task)) {
      const tokenResult = resolveGitHubToken();
      if (tokenResult.ok) {
        const client = new GitHubClient(tokenResult.token);
        const { owner, repo } = config.github;
        await client.updateIssue(
          owner,
          repo,
          task.github.issue_number,
          taskToIssueUpdate(task) as Record<string, unknown>,
        );
        const synced = {
          ...task,
          github: {
            ...task.github,
            synced_at: new Date().toISOString(),
          },
        };
        const revalidated = TaskSchema.parse(synced);
        task = revalidated;
        writeTaskFile(result.filePath, task);
      }
    }

    rebuildSnapshot(paths);
    return c.json({ task });
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
      const last = parsed.data.last_full_sync_at ?? null;
      return c.json({
        config: parsed.data,
        last_full_sync_at: last,
      });
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
  });

  // ── POST /api/sync ─────────────────────────────────────────────────
  app.post("/api/sync", async (c) => {
    const config = readConfig();
    if (config.sync.preset === "offline") {
      return c.json({ error: "Cannot sync in offline mode" }, 400);
    }
    const tokenResult = resolveGitHubToken();
    if (!tokenResult.ok) {
      return c.json(
        {
          error: "GitHub authentication required",
          hint: "hint" in tokenResult.error ? tokenResult.error.hint : undefined,
        },
        401,
      );
    }
    const client = new GitHubClient(tokenResult.token);
    const { owner, repo } = config.github;
    const now = new Date();
    await fullSync({
      client,
      owner,
      repo,
      tasksDir: paths.tasksDir,
      snapshotPath: paths.snapshotPath,
      now,
    });
    const iso = new Date().toISOString();
    writeLastFullSyncAt(paths, iso);
    return c.json({ ok: true, last_full_sync_at: iso });
  });

  // ── GET /api/repo-file ─────────────────────────────────────────────
  app.get("/api/repo-file", (c) => {
    const rel = c.req.query("path") ?? "";
    const abs = resolveSafeRepoPath(root, rel);
    if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return c.json({ error: "Not found" }, 404);
    }
    try {
      const content = fs.readFileSync(abs, "utf8");
      return c.json({ path: rel, content });
    } catch {
      return c.json({ error: "Failed to read file" }, 500);
    }
  });

  return app;
}
