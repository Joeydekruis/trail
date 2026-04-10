import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  isTaskStoreValidationError,
  loadAllTasks,
  readTaskFile,
  writeTaskFile,
} from "./task-store.js";

const minimalValidTask = {
  id: "047",
  title: "Example",
  status: "todo" as const,
  type: "feature" as const,
  created_at: "2026-04-10T10:00:00.000Z",
  updated_at: "2026-04-10T14:30:00.000Z",
};

const minimalValidTaskB = {
  ...minimalValidTask,
  id: "048",
  title: "Second",
};

describe("task-store", () => {
  it("loadAllTasks returns two tasks from a temp dir with two valid JSON files", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-task-store-"));
    fs.writeFileSync(
      path.join(dir, "047.json"),
      `${JSON.stringify(minimalValidTask)}\n`,
      "utf8",
    );
    fs.writeFileSync(
      path.join(dir, "048.json"),
      `${JSON.stringify(minimalValidTaskB)}\n`,
      "utf8",
    );

    const tasks = loadAllTasks(dir);
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.id).sort()).toEqual(["047", "048"]);
  });

  it("loadAllTasks returns [] when the tasks directory does not exist", () => {
    const missing = path.join(os.tmpdir(), `trail-no-tasks-${Date.now()}`);
    expect(loadAllTasks(missing)).toEqual([]);
  });

  it("readTaskFile throws VALIDATION_FAILED for corrupt JSON", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-task-store-"));
    const filePath = path.join(dir, "bad.json");
    fs.writeFileSync(filePath, "{ not json", "utf8");

    try {
      readTaskFile(filePath);
      expect.fail("expected throw");
    } catch (e) {
      expect(isTaskStoreValidationError(e)).toBe(true);
      if (isTaskStoreValidationError(e)) {
        expect(e.trailError.code).toBe("VALIDATION_FAILED");
        expect(e.trailError.message).toContain("Invalid JSON");
      }
    }
  });

  it("readTaskFile throws VALIDATION_FAILED for invalid task shape", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-task-store-"));
    const filePath = path.join(dir, "bad.json");
    fs.writeFileSync(filePath, JSON.stringify({ foo: 1 }), "utf8");

    try {
      readTaskFile(filePath);
      expect.fail("expected throw");
    } catch (e) {
      expect(isTaskStoreValidationError(e)).toBe(true);
      if (isTaskStoreValidationError(e)) {
        expect(e.trailError.code).toBe("VALIDATION_FAILED");
        expect(e.trailError.issues).toBeDefined();
      }
    }
  });

  it("loadAllTasks throws on first invalid file (lexicographic order)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-task-store-"));
    fs.writeFileSync(path.join(dir, "a.json"), "{", "utf8");
    fs.writeFileSync(
      path.join(dir, "z.json"),
      JSON.stringify(minimalValidTask),
      "utf8",
    );

    expect(() => loadAllTasks(dir)).toThrow();
    try {
      loadAllTasks(dir);
    } catch (e) {
      expect(isTaskStoreValidationError(e)).toBe(true);
    }
  });
});

describe("writeTaskFile", () => {
  it("writes pretty JSON with trailing newline and round-trips", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-task-store-"));
    const filePath = path.join(dir, "047.json");
    writeTaskFile(filePath, minimalValidTask);

    const text = fs.readFileSync(filePath, "utf8");
    expect(text.endsWith("\n")).toBe(true);
    expect(text).toContain("\n");

    const task = readTaskFile(filePath);
    expect(task.id).toBe("047");
    expect(task.title).toBe("Example");
  });
});
