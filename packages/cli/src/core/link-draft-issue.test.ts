import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { GitHubIssue } from "./github-types.js";
import type { GitHubClient } from "./github-client.js";
import { linkDraftToNewGitHubIssue } from "./link-draft-issue.js";
import { readTaskFile } from "./task-store.js";
import type { Task } from "../schemas/task.js";

const now = new Date("2026-04-11T12:00:00.000Z");

function issue(n: number): GitHubIssue {
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
  };
}

describe("linkDraftToNewGitHubIssue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates an issue, removes the draft file, and writes numbered task json", async () => {
    const createIssue = vi.fn().mockResolvedValue(issue(42));
    const client = { createIssue } as unknown as GitHubClient;

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trail-link-draft-"));
    const draftPath = path.join(dir, "draft-abc.json");

    const draft: Task = {
      id: "draft-abc",
      title: "Hello",
      description: "World",
      status: "draft",
      type: "feature",
      labels: ["trail"],
      depends_on: [],
      blocks: [],
      refs: [],
      github: null,
      created_at: "2026-04-01T10:00:00.000Z",
      updated_at: "2026-04-01T10:00:00.000Z",
    };

    fs.writeFileSync(draftPath, JSON.stringify(draft), "utf-8");

    await linkDraftToNewGitHubIssue({
      client,
      owner: "o",
      repo: "r",
      draft,
      draftFilePath: draftPath,
      tasksDir: dir,
      now,
    });

    expect(createIssue).toHaveBeenCalledWith("o", "r", {
      title: "Hello",
      body: "World",
      labels: ["trail"],
    });
    expect(fs.existsSync(draftPath)).toBe(false);
    const out = readTaskFile(path.join(dir, "42.json"));
    expect(out.id).toBe("42");
    expect(out.github?.issue_number).toBe(42);
  });
});
