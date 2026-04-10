import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitHubIssue } from "./github-types.js";
import type { GitHubClient } from "./github-client.js";
import { loadAllTasks, readTaskFile, writeTaskFile } from "./task-store.js";
import { fullSync, pullSync, pushSync, syncFull } from "./sync.js";
import type { Task } from "../schemas/task.js";

const now = new Date("2026-04-11T12:00:00.000Z");

function issue(n: number, overrides: Partial<GitHubIssue> = {}): GitHubIssue {
  return {
    number: n,
    title: `Issue ${n}`,
    body: `Body ${n}`,
    state: "open",
    labels: [],
    assignee: null,
    milestone: null,
    html_url: `https://github.com/o/r/issues/${n}`,
    updated_at: "2026-04-10T15:30:45.000Z",
    ...overrides,
  };
}

function mockClient(overrides: {
  listIssues?: GitHubClient["listIssues"];
  updateIssue?: GitHubClient["updateIssue"];
}): GitHubClient {
  return {
    listIssues: overrides.listIssues ?? vi.fn().mockResolvedValue([]),
    updateIssue: overrides.updateIssue ?? vi.fn().mockResolvedValue(issue(1)),
  } as unknown as GitHubClient;
}

describe("sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pullSync paginates listIssues until a short page and writes task files", async () => {
    const p1 = Array.from({ length: 100 }, (_, i) => issue(i + 1));
    const p2 = [issue(101), issue(102)];
    const listIssues = vi
      .fn()
      .mockResolvedValueOnce(p1)
      .mockResolvedValueOnce(p2);

    const client = mockClient({ listIssues });
    const tasksDir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-sync-pull-"));

    await pullSync({
      client,
      owner: "o",
      repo: "r",
      tasksDir,
      now,
    });

    expect(listIssues).toHaveBeenCalledTimes(2);
    expect(listIssues).toHaveBeenNthCalledWith(1, "o", "r", {
      state: "all",
      per_page: 100,
      page: 1,
    });
    expect(listIssues).toHaveBeenNthCalledWith(2, "o", "r", {
      state: "all",
      per_page: 100,
      page: 2,
    });

    const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith(".json"));
    expect(files).toHaveLength(102);
    const t42 = readTaskFile(path.join(tasksDir, "42.json"));
    expect(t42.id).toBe("42");
    expect(t42.title).toBe("Issue 42");
    const t102 = readTaskFile(path.join(tasksDir, "102.json"));
    expect(t102.id).toBe("102");
  });

  it("pullSync merges existing task file when present", async () => {
    const listIssues = vi.fn().mockResolvedValue([issue(7, { title: "From GitHub" })]);
    const client = mockClient({ listIssues });
    const tasksDir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-sync-merge-"));

    const existing: Task = {
      id: "7",
      title: "Local",
      description: "",
      status: "todo",
      type: "feature",
      labels: [],
      depends_on: ["1"],
      blocks: [],
      refs: [],
      github: null,
      created_at: "2026-04-01T10:00:00.000Z",
      updated_at: "2026-04-01T10:00:00.000Z",
    };
    writeTaskFile(path.join(tasksDir, "7.json"), existing);

    await pullSync({ client, owner: "o", repo: "r", tasksDir, now });

    const merged = readTaskFile(path.join(tasksDir, "7.json"));
    expect(merged.title).toBe("From GitHub");
    expect(merged.depends_on).toEqual(["1"]);
    expect(merged.github?.issue_number).toBe(7);
  });

  it("pushSync skips draft and unlinked tasks; updates linked issues", async () => {
    const updateIssue = vi.fn().mockResolvedValue(issue(2));
    const client = mockClient({ updateIssue });

    const linked: Task = {
      id: "2",
      title: "Push me",
      description: "Desc",
      status: "todo",
      type: "feature",
      labels: ["a"],
      depends_on: [],
      blocks: [],
      refs: [],
      github: {
        issue_number: 2,
        synced_at: "2026-04-10T10:00:00.000Z",
        url: "https://github.com/o/r/issues/2",
      },
      created_at: "2026-04-01T10:00:00.000Z",
      updated_at: "2026-04-01T10:00:00.000Z",
    };

    const draftLinked: Task = {
      ...linked,
      id: "3",
      status: "draft",
      github: {
        issue_number: 3,
        synced_at: "2026-04-10T10:00:00.000Z",
        url: "https://github.com/o/r/issues/3",
      },
    };

    const localOnly: Task = {
      ...linked,
      id: "9",
      github: undefined,
    };

    await pushSync({
      client,
      owner: "o",
      repo: "r",
      tasks: [linked, draftLinked, localOnly],
    });

    expect(updateIssue).toHaveBeenCalledTimes(1);
    expect(updateIssue).toHaveBeenCalledWith("o", "r", 2, {
      title: "Push me",
      body: "Desc",
      state: "open",
      labels: ["a"],
    });
  });

  it("syncFull pulls and writes snapshot without calling updateIssue", async () => {
    const listIssues = vi.fn().mockResolvedValue([issue(5)]);
    const updateIssue = vi.fn();
    const client = mockClient({ listIssues, updateIssue });

    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-sync-full-"));
    const tasksDir = path.join(root, "tasks");
    const snapshotPath = path.join(root, "snapshot.json");

    await syncFull({
      client,
      owner: "o",
      repo: "r",
      tasksDir,
      snapshotPath,
      now,
    });

    expect(updateIssue).not.toHaveBeenCalled();
    expect(fs.readFileSync(snapshotPath, "utf8")).toContain('"generated_at"');
    const loaded = loadAllTasks(tasksDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("5");
  });

  it("fullSync pulls, pushes linked tasks, then writes snapshot", async () => {
    const listIssues = vi.fn().mockResolvedValue([issue(11, { title: "Pulled" })]);
    const updateIssue = vi.fn().mockResolvedValue(issue(11));
    const client = mockClient({ listIssues, updateIssue });

    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-sync-full2-"));
    const tasksDir = path.join(root, "tasks");
    const snapshotPath = path.join(root, "out.json");

    await fullSync({
      client,
      owner: "o",
      repo: "r",
      tasksDir,
      snapshotPath,
      now,
    });

    expect(updateIssue).toHaveBeenCalledWith(
      "o",
      "r",
      11,
      expect.objectContaining({ title: "Pulled" }),
    );
    expect(fs.existsSync(snapshotPath)).toBe(true);
    const snap = JSON.parse(fs.readFileSync(snapshotPath, "utf8")) as {
      tasks: Task[];
    };
    expect(snap.tasks).toHaveLength(1);
    expect(snap.tasks[0]?.title).toBe("Pulled");
  });
});
