import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import type { TrailError } from "./errors.js";
import { TaskSchema, type Task } from "../schemas/task.js";

/** Thrown by task-store when validation fails; inspect `.trailError` for `VALIDATION_FAILED`. */
export type TaskStoreError = Error & { trailError: TrailError };

export function toValidationError(
  zodError: z.ZodError,
  context?: string,
): Extract<TrailError, { code: "VALIDATION_FAILED" }> {
  const issues = zodError.issues.map(
    (i) => `${i.path.length ? i.path.join(".") : "(root)"}: ${i.message}`,
  );
  return {
    code: "VALIDATION_FAILED",
    message: context
      ? `Task validation failed (${context})`
      : "Task validation failed",
    details: zodError.message,
    issues,
  };
}

function throwValidationFailed(
  err: Extract<TrailError, { code: "VALIDATION_FAILED" }>,
): never {
  const e = new Error(`[VALIDATION_FAILED] ${err.message}`) as TaskStoreError;
  e.name = "TrailError";
  e.trailError = err;
  throw e;
}

export function isTaskStoreValidationError(
  e: unknown,
): e is TaskStoreError & { trailError: Extract<TrailError, { code: "VALIDATION_FAILED" }> } {
  return (
    e instanceof Error &&
    "trailError" in e &&
    typeof (e as TaskStoreError).trailError === "object" &&
    (e as TaskStoreError).trailError !== null &&
    "code" in (e as TaskStoreError).trailError &&
    (e as TaskStoreError).trailError.code === "VALIDATION_FAILED"
  );
}

/**
 * Lists `*.json` basenames under `tasksDir`, excluding `snapshot.json`, sorted lexicographically.
 */
export function listTaskFiles(tasksDir: string): string[] {
  const names = fs.readdirSync(tasksDir);
  return names
    .filter(
      (n) => n.endsWith(".json") && n !== "snapshot.json",
    )
    .sort((a, b) => a.localeCompare(b));
}

export function readTaskFile(filePath: string): Task {
  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    if (e instanceof SyntaxError) {
      throwValidationFailed({
        code: "VALIDATION_FAILED",
        message: "Invalid JSON in task file",
        details: filePath,
      });
    }
    throw e;
  }

  const parsed = TaskSchema.safeParse(raw);
  if (!parsed.success) {
    throwValidationFailed(toValidationError(parsed.error, filePath));
  }
  return parsed.data;
}

export function writeTaskFile(filePath: string, task: Task): void {
  const parsed = TaskSchema.safeParse(task);
  if (!parsed.success) {
    throwValidationFailed(toValidationError(parsed.error, filePath));
  }
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const body = `${JSON.stringify(parsed.data, null, 2)}\n`;
  fs.writeFileSync(filePath, body, "utf8");
}

/**
 * Loads all task JSON files from `tasksDir`. Returns an empty array if the directory is missing.
 * Stops on the first file that fails to parse or validate.
 */
export function loadAllTasks(tasksDir: string): Task[] {
  if (!fs.existsSync(tasksDir)) {
    return [];
  }
  const files = listTaskFiles(tasksDir);
  return files.map((name) => readTaskFile(path.join(tasksDir, name)));
}
