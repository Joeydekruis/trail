import path from "node:path";

import type { TrailError } from "../../core/errors.js";
import { generateDraftId } from "../../core/draft-id.js";
import { findTrailRoot, trailPaths } from "../../core/paths.js";
import { rebuildSnapshot } from "../../core/rebuild-snapshot.js";
import { writeTaskFile } from "../../core/task-store.js";
import { TaskSchema, type Task } from "../../schemas/task.js";

export type CreateOptions = {
  title: string;
  description?: string;
  type?: "feature" | "bug" | "chore" | "epic";
  priority?: "p0" | "p1" | "p2" | "p3";
};

export function runCreate(options: CreateOptions): void {
  const root = findTrailRoot(process.cwd());
  if (root === null) {
    const err: TrailError = {
      code: "NOT_A_TRAIL_REPO",
      message:
        "Not a Trail repository (missing .trail/config.json). Run `trail init` first.",
      path: process.cwd(),
    };
    throw err;
  }

  const paths = trailPaths(root);
  const now = new Date();
  const iso = now.toISOString();
  const id = generateDraftId();

  const raw: Task = {
    id,
    title: options.title,
    description: options.description ?? "",
    status: "draft",
    type: options.type ?? "feature",
    labels: [],
    depends_on: [],
    blocks: [],
    refs: [],
    created_at: iso,
    updated_at: iso,
  };
  if (options.priority !== undefined) {
    raw.priority = options.priority;
  }

  const task = TaskSchema.parse(raw);
  const filePath = path.join(paths.tasksDir, `${id}.json`);
  writeTaskFile(filePath, task);
  rebuildSnapshot(paths, now);

  console.log(`Created draft task ${id}`);
  console.log(`  File: ${filePath}`);
}
