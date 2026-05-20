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
  fullSync,
  readTrailConfig,
  writeLastFullSyncAt,
  writeTrailConfig,
  publishTaskToGitHub,
  shouldPublishTaskToGitHub,
  listDocs,
  readDocFile,
  writeDocFile,
  deleteDocFile,
  resolveDocPath,
  slugifyDocPath,
  uniqueDocPath
} from "@trail-pm/cli/lib";
var GITHUB_AUTH_HINT = "Set GITHUB_TOKEN or run `gh auth login` to sync with GitHub.";
function isPathInsideRepo(repoRoot, absolutePath) {
  const root = path.resolve(repoRoot);
  const candidate = path.resolve(absolutePath);
  const rel = path.relative(root, candidate);
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
var OPTIONAL_TASK_CLEAR_KEYS = [
  "assignee",
  "milestone",
  "priority",
  "estimate",
  "due_date",
  "start_date",
  "branch",
  "parent"
];
function applyOptionalClears(merged) {
  for (const key of OPTIONAL_TASK_CLEAR_KEYS) {
    if (merged[key] === null) {
      delete merged[key];
    }
  }
}
function createApi(root) {
  const app = new Hono();
  const paths = trailPaths(root);
  app.use("/api/*", cors());
  function readConfig() {
    const raw = fs.readFileSync(paths.configPath, "utf8");
    return TrailConfigSchema.parse(JSON.parse(raw));
  }
  app.get("/api/tasks", (c) => {
    const tasks = loadAllTasks(paths.tasksDir);
    return c.json({ tasks });
  });
  app.get("/api/tasks/:id/comments", async (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    const issueNumber = result.task.github?.issue_number;
    if (issueNumber === void 0) {
      return c.json({ comments: [] });
    }
    const config = readConfig();
    if (config.sync.preset === "offline") {
      return c.json({ comments: [] });
    }
    const tokenResult = resolveGitHubToken();
    if (!tokenResult.ok) {
      return c.json(
        { error: "GitHub authentication required", hint: GITHUB_AUTH_HINT },
        401
      );
    }
    const { owner, repo } = config.github;
    const client = new GitHubClient(tokenResult.token);
    try {
      const raw = await client.listIssueComments(owner, repo, issueNumber);
      const comments = raw.map((comment) => ({
        id: comment.id,
        body: comment.body,
        author: comment.user?.login ?? "unknown",
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        url: comment.html_url
      }));
      return c.json({ comments });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load comments";
      return c.json({ error: message }, 502);
    }
  });
  app.post("/api/tasks/:id/comments", async (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    const issueNumber = result.task.github?.issue_number;
    if (issueNumber === void 0) {
      return c.json(
        { error: "Task is not linked to a GitHub issue" },
        400
      );
    }
    const body = await c.req.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return c.json({ error: "Comment body is required" }, 400);
    }
    const config = readConfig();
    if (config.sync.preset === "offline") {
      return c.json({ error: "Cannot post comments in offline mode" }, 400);
    }
    const tokenResult = resolveGitHubToken();
    if (!tokenResult.ok) {
      return c.json(
        { error: "GitHub authentication required", hint: GITHUB_AUTH_HINT },
        401
      );
    }
    const { owner, repo } = config.github;
    const client = new GitHubClient(tokenResult.token);
    try {
      const created = await client.createIssueComment(
        owner,
        repo,
        issueNumber,
        text
      );
      return c.json(
        {
          comment: {
            id: created.id,
            body: created.body,
            author: created.user?.login ?? "unknown",
            created_at: created.created_at,
            updated_at: created.updated_at,
            url: created.html_url
          }
        },
        201
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to post comment";
      return c.json({ error: message }, 502);
    }
  });
  app.get("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ task: result.task });
  });
  app.post("/api/tasks", async (c) => {
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
    let task = parsed.data;
    let warning;
    if (shouldPublishTaskToGitHub(config.sync.preset, task.status)) {
      const tokenResult = resolveGitHubToken();
      if (!tokenResult.ok) {
        warning = `Task saved locally only: ${GITHUB_AUTH_HINT}`;
      } else {
        const client = new GitHubClient(tokenResult.token);
        const published = await publishTaskToGitHub({
          config,
          paths,
          task,
          filePath: draftPath,
          client,
          now
        });
        task = published.task;
        if (!published.ok) {
          warning = published.warning;
        }
      }
    }
    rebuildSnapshot(paths, now);
    return c.json(warning !== void 0 ? { task, warning } : { task }, 201);
  });
  app.patch("/api/tasks/:id", async (c) => {
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
    applyOptionalClears(merged);
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
    let warning;
    let filePath = result.filePath;
    if (shouldPublishTaskToGitHub(config.sync.preset, task.status)) {
      const tokenResult = resolveGitHubToken();
      if (!tokenResult.ok) {
        warning = `Saved locally only: ${GITHUB_AUTH_HINT}`;
      } else {
        const client = new GitHubClient(tokenResult.token);
        const published = await publishTaskToGitHub({
          config,
          paths,
          task,
          filePath,
          client
        });
        task = published.task;
        filePath = published.filePath;
        if (!published.ok) {
          warning = published.warning;
        }
      }
    }
    rebuildSnapshot(paths);
    return c.json(warning !== void 0 ? { task, warning } : { task });
  });
  app.delete("/api/tasks/:id", (c) => {
    const result = findTaskFileById(paths.tasksDir, c.req.param("id"));
    if (!result) {
      return c.json({ error: "Task not found" }, 404);
    }
    fs.unlinkSync(result.filePath);
    rebuildSnapshot(paths);
    return c.json({ deleted: true });
  });
  function formatConfigPayload(config) {
    return {
      config,
      last_full_sync_at: config.last_full_sync_at ?? null
    };
  }
  app.get("/api/assignees", async (c) => {
    let config;
    try {
      config = readConfig();
    } catch {
      return c.json({ assignees: [] });
    }
    if (config.sync.preset === "offline") {
      return c.json({ assignees: [] });
    }
    const tokenResult = resolveGitHubToken();
    if (!tokenResult.ok) {
      return c.json({ assignees: [] });
    }
    const { owner, repo } = config.github;
    const client = new GitHubClient(tokenResult.token);
    try {
      const users = await client.listAssignees(owner, repo);
      const assignees = users.map((u) => u.login).sort((a, b) => a.localeCompare(b));
      return c.json({ assignees });
    } catch {
      return c.json({ assignees: [] });
    }
  });
  app.get("/api/config", (c) => {
    try {
      const config = readTrailConfig(paths);
      return c.json(formatConfigPayload(config));
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
  });
  app.patch("/api/config", async (c) => {
    const body = await c.req.json();
    let existing;
    try {
      existing = readTrailConfig(paths);
    } catch {
      return c.json({ error: "Config not found" }, 404);
    }
    const merged = {
      github: {
        ...existing.github,
        ...typeof body.github === "object" && body.github !== null ? body.github : {}
      },
      sync: {
        ...existing.sync,
        ...typeof body.sync === "object" && body.sync !== null ? body.sync : {}
      },
      ...existing.last_full_sync_at !== void 0 ? { last_full_sync_at: existing.last_full_sync_at } : {}
    };
    const parsed = TrailConfigSchema.safeParse(merged);
    if (!parsed.success) {
      return c.json(
        { error: "Validation failed", issues: parsed.error.issues },
        400
      );
    }
    writeTrailConfig(paths, parsed.data);
    return c.json(formatConfigPayload(parsed.data));
  });
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
  app.get("/api/docs", (c) => {
    fs.mkdirSync(paths.docsDir, { recursive: true });
    const docs = listDocs(paths.docsDir);
    const tasks = loadAllTasks(paths.tasksDir);
    const withTasks = docs.map((doc) => ({
      ...doc,
      task_ids: tasks.filter(
        (t) => t.refs.some(
          (ref) => ref.type === "doc" && (ref.path === doc.path || ref.path === `docs/${doc.path}` || ref.path.replace(/^\.trail\/docs\//, "") === doc.path)
        )
      ).map((t) => t.id)
    }));
    return c.json({ docs: withTasks });
  });
  app.get("/api/docs/file", (c) => {
    const rel = c.req.query("path") ?? "";
    fs.mkdirSync(paths.docsDir, { recursive: true });
    const doc = readDocFile(paths.docsDir, rel);
    if (!doc) {
      return c.json({ error: "Document not found" }, 404);
    }
    const tasks = loadAllTasks(paths.tasksDir);
    const task_ids = tasks.filter(
      (t) => t.refs.some(
        (ref) => ref.type === "doc" && (ref.path === doc.path || ref.path === `docs/${doc.path}` || ref.path.replace(/^\.trail\/docs\//, "") === doc.path)
      )
    ).map((t) => t.id);
    return c.json({ doc: { ...doc, task_ids } });
  });
  app.post("/api/docs", async (c) => {
    const body = await c.req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : title ? `# ${title}

` : "# Untitled\n\n";
    let rel = typeof body.path === "string" && body.path.trim() ? body.path.trim().replace(/\\/g, "/") : slugifyDocPath(title || "untitled");
    if (!rel.endsWith(".md") && !rel.endsWith(".mdx")) {
      rel = `${rel}.md`;
    }
    fs.mkdirSync(paths.docsDir, { recursive: true });
    rel = uniqueDocPath(paths.docsDir, rel);
    const written = writeDocFile(paths.docsDir, rel, content);
    return c.json({ doc: written }, 201);
  });
  app.patch("/api/docs/file", async (c) => {
    const rel = (c.req.query("path") ?? "").trim();
    const existing = readDocFile(paths.docsDir, rel);
    if (!existing) {
      return c.json({ error: "Document not found" }, 404);
    }
    const body = await c.req.json();
    let targetRel = rel;
    if (typeof body.path === "string" && body.path.trim()) {
      const next = resolveDocPath(paths.docsDir, body.path.trim());
      if (!next) {
        return c.json({ error: "Invalid document path" }, 400);
      }
      if (next.relative !== rel) {
        if (fs.existsSync(next.absolute)) {
          return c.json({ error: "Document path already exists" }, 409);
        }
        fs.renameSync(
          resolveDocPath(paths.docsDir, rel).absolute,
          next.absolute
        );
        targetRel = next.relative;
      }
    }
    const content = typeof body.content === "string" ? body.content : existing.content;
    const written = writeDocFile(paths.docsDir, targetRel, content);
    return c.json({ doc: written });
  });
  app.delete("/api/docs/file", (c) => {
    const rel = c.req.query("path") ?? "";
    if (!deleteDocFile(paths.docsDir, rel)) {
      return c.json({ error: "Document not found" }, 404);
    }
    const tasks = loadAllTasks(paths.tasksDir);
    for (const task of tasks) {
      const nextRefs = task.refs.filter(
        (ref) => !(ref.type === "doc" && (ref.path === rel || ref.path === `docs/${rel}` || ref.path.replace(/^\.trail\/docs\//, "") === rel))
      );
      if (nextRefs.length !== task.refs.length) {
        const result = findTaskFileById(paths.tasksDir, task.id);
        if (result) {
          writeTaskFile(result.filePath, {
            ...task,
            refs: nextRefs,
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
    }
    rebuildSnapshot(paths);
    return c.json({ deleted: true });
  });
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
export {
  createApi
};
//# sourceMappingURL=api-BA4YFDXN.js.map