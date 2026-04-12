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
  TrailConfigSchema,
  resolveGitHubToken,
  GitHubClient,
  taskToIssueUpdate,
  fullSync,
  writeLastFullSyncAt,
  linkDraftToNewGitHubIssue
} from "@trail-pm/cli/lib";
function isPathInsideRepo(repoRoot, absolutePath) {
  const root2 = path.resolve(repoRoot);
  const candidate = path.resolve(absolutePath);
  const rel = path.relative(root2, candidate);
  return rel !== "" && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel);
}
function resolveSafeRepoPath(repoRoot, rel) {
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
function isLinkedTask(task) {
  return task.github != null && typeof task.github === "object";
}
function createApi(root2) {
  const app2 = new Hono();
  const paths = trailPaths(root2);
  app2.use("/api/*", cors());
  function readConfig() {
    const raw = fs.readFileSync(paths.configPath, "utf8");
    return TrailConfigSchema.parse(JSON.parse(raw));
  }
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
    const now = /* @__PURE__ */ new Date();
    const nowIso = now.toISOString();
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
      created_at: nowIso,
      updated_at: nowIso
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
            warning: "Task saved locally only: set GITHUB_TOKEN or run `gh auth login` to create the GitHub issue in collaborative mode."
          },
          201
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
        now
      });
      rebuildSnapshot(paths, now);
      return c.json({ task: promoted }, 201);
    }
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
          taskToIssueUpdate(task)
        );
        const synced = {
          ...task,
          github: {
            ...task.github,
            synced_at: (/* @__PURE__ */ new Date()).toISOString()
          }
        };
        const revalidated = TaskSchema.parse(synced);
        task = revalidated;
        writeTaskFile(result.filePath, task);
      }
    }
    rebuildSnapshot(paths);
    return c.json({ task });
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
      const last = parsed.data.last_full_sync_at ?? null;
      return c.json({
        config: parsed.data,
        last_full_sync_at: last
      });
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
  });
  app2.post("/api/sync", async (c) => {
    const config = readConfig();
    if (config.sync.preset === "offline") {
      return c.json({ error: "Cannot sync in offline mode" }, 400);
    }
    const tokenResult = resolveGitHubToken();
    if (!tokenResult.ok) {
      return c.json(
        {
          error: "GitHub authentication required",
          hint: "hint" in tokenResult.error ? tokenResult.error.hint : void 0
        },
        401
      );
    }
    const client = new GitHubClient(tokenResult.token);
    const { owner, repo } = config.github;
    const now = /* @__PURE__ */ new Date();
    await fullSync({
      client,
      owner,
      repo,
      tasksDir: paths.tasksDir,
      snapshotPath: paths.snapshotPath,
      now
    });
    const iso = (/* @__PURE__ */ new Date()).toISOString();
    writeLastFullSyncAt(paths, iso);
    return c.json({ ok: true, last_full_sync_at: iso });
  });
  app2.get("/api/repo-file", (c) => {
    const rel = c.req.query("path") ?? "";
    const abs = resolveSafeRepoPath(root2, rel);
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