import { describe, expect, it } from "vitest";

import type { GitHubIssue } from "./github-types.js";
import { composeIssueBody } from "./issue-body.js";
import { issueToTask, taskToIssueUpdate } from "./github-mapper.js";
import type { Task } from "../schemas/task.js";

const now = new Date("2026-04-11T12:00:00.000Z");

const minimalIssue: GitHubIssue = {
  number: 42,
  title: "Ship mapper",
  body: "Map issues to tasks.",
  state: "open",
  labels: [{ name: "enhancement" }],
  assignee: { login: "alice" },
  milestone: { title: "MVP A" },
  html_url: "https://github.com/org/repo/issues/42",
  updated_at: "2026-04-10T15:30:45.000Z",
};

describe("github-mapper", () => {
  it("maps a minimal open issue to a task with expected title and status", () => {
    const task = issueToTask(minimalIssue, null, now);

    expect(task.id).toBe("42");
    expect(task.title).toBe("Ship mapper");
    expect(task.status).toBe("todo");
    expect(task.description).toBe("Map issues to tasks.");
    expect(task.labels).toEqual(["enhancement"]);
    expect(task.assignee).toBe("alice");
    expect(task.milestone).toBe("MVP A");
    expect(task.github).toEqual({
      issue_number: 42,
      synced_at: now.toISOString(),
      url: "https://github.com/org/repo/issues/42",
    });
  });

  it("maps a closed issue to status done", () => {
    const closed: GitHubIssue = { ...minimalIssue, state: "closed" };
    const task = issueToTask(closed, null, now);
    expect(task.status).toBe("done");
  });

  it("reads in_progress from trail meta block in the issue body", () => {
    const withMeta: GitHubIssue = {
      ...minimalIssue,
      body: composeIssueBody("Map issues to tasks.", {
        status: "in_progress",
        type: "feature",
      }),
    };
    const task = issueToTask(withMeta, null, now);
    expect(task.status).toBe("in_progress");
    expect(task.description).toBe("Map issues to tasks.");
  });

  it("taskToIssueUpdate embeds trail meta in the issue body", () => {
    const base = issueToTask(minimalIssue, null, now);
    const task: Task = { ...base, priority: "p2", estimate: "sm" };
    const update = taskToIssueUpdate(task);
    expect(update.body).toContain("trail:v1");
    expect(update.body).toContain("Map issues to tasks.");
    expect(update.body).toContain('"priority": "p2"');
  });

  it("taskToIssueUpdate adds priority label when priority is p1", () => {
    const base = issueToTask(minimalIssue, null, now);
    const task: Task = { ...base, priority: "p1", labels: ["enhancement"] };
    const update = taskToIssueUpdate(task);
    expect(update.labels).toContain("priority:p1");
    expect(update.labels).toContain("enhancement");
  });

  it("taskToIssueUpdate sets assignees from task assignee", () => {
    const base = issueToTask(minimalIssue, null, now);
    const task: Task = { ...base, assignee: "bob" };
    expect(taskToIssueUpdate(task).assignees).toEqual(["bob"]);
  });

  it("taskToIssueUpdate clears assignees when assignee is empty", () => {
    const base = issueToTask(minimalIssue, null, now);
    const task: Task = { ...base, assignee: undefined };
    expect(taskToIssueUpdate(task).assignees).toEqual([]);
  });
});
