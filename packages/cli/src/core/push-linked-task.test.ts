import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitHubClient } from "./github-client.js";
import {
  canSyncWithGitHub,
  isLinkedTask,
  isPublishableStatus,
  pushLinkedTaskToGitHub,
  shouldPublishTaskToGitHub,
} from "./push-linked-task.js";
import type { Task } from "../schemas/task.js";

describe("canSyncWithGitHub", () => {
  it("is false for offline", () => {
    expect(canSyncWithGitHub("offline")).toBe(false);
  });

  it("is true for solo and collaborative", () => {
    expect(canSyncWithGitHub("solo")).toBe(true);
    expect(canSyncWithGitHub("collaborative")).toBe(true);
  });
});

describe("isPublishableStatus", () => {
  it("is false for draft only", () => {
    expect(isPublishableStatus("draft")).toBe(false);
    expect(isPublishableStatus("todo")).toBe(true);
    expect(isPublishableStatus("in_progress")).toBe(true);
    expect(isPublishableStatus("done")).toBe(true);
  });
});

describe("shouldPublishTaskToGitHub", () => {
  it("requires non-offline preset and todo+ status", () => {
    expect(shouldPublishTaskToGitHub("collaborative", "todo")).toBe(true);
    expect(shouldPublishTaskToGitHub("solo", "todo")).toBe(true);
    expect(shouldPublishTaskToGitHub("collaborative", "draft")).toBe(false);
    expect(shouldPublishTaskToGitHub("offline", "todo")).toBe(false);
  });
});

describe("isLinkedTask", () => {
  it("detects github metadata", () => {
    const task = {
      id: "1",
      github: { issue_number: 1, synced_at: "2026-01-01T00:00:00.000Z", url: "https://x" },
    } as Task;
    expect(isLinkedTask(task)).toBe(true);
  });
});

describe("pushLinkedTaskToGitHub", () => {
  const tmpDirs: string[] = [];

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("updates the issue and writes synced_at to disk", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-push-"));
    tmpDirs.push(dir);
    const filePath = path.join(dir, "1.json");

    const task: Task & { github: NonNullable<Task["github"]> } = {
      id: "1",
      title: "Hello",
      status: "todo",
      type: "feature",
      labels: [],
      depends_on: [],
      blocks: [],
      refs: [],
      github: {
        issue_number: 1,
        synced_at: "2026-01-01T00:00:00.000Z",
        url: "https://github.com/o/r/issues/1",
      },
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    fs.writeFileSync(filePath, JSON.stringify(task));

    const updateIssue = vi.fn().mockResolvedValue({});
    const client = { updateIssue } as unknown as GitHubClient;

    const result = await pushLinkedTaskToGitHub({
      client,
      owner: "o",
      repo: "r",
      task,
      filePath,
      now: new Date("2026-05-20T12:00:00.000Z"),
    });

    expect(updateIssue).toHaveBeenCalledOnce();
    expect(result.github?.synced_at).toBe("2026-05-20T12:00:00.000Z");
    const onDisk = JSON.parse(fs.readFileSync(filePath, "utf8")) as Task;
    expect(onDisk.github?.synced_at).toBe("2026-05-20T12:00:00.000Z");
  });
});
