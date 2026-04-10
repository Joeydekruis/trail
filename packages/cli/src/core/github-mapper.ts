import type { GitHubIssue } from "./github-types.js";
import { TaskSchema, type Task } from "../schemas/task.js";

function statusFromIssue(issue: GitHubIssue, existing: Task | null): Task["status"] {
  if (issue.state === "closed") {
    return "done";
  }
  const prev = existing?.status;
  if (prev === "in_progress" || prev === "in_review") {
    return prev;
  }
  return "todo";
}

function parseIssueTimestamp(issue: GitHubIssue, fallback: Date): string {
  if (issue.updated_at.trim() === "") {
    return fallback.toISOString();
  }
  return issue.updated_at;
}

/**
 * Maps a GitHub issue to a Trail task. GitHub wins for title, body, labels, assignee, milestone;
 * local-only fields are preserved from `existing` when present.
 */
export function issueToTask(
  issue: GitHubIssue,
  existing: Task | null,
  now: Date,
): Task {
  const updatedAt = parseIssueTimestamp(issue, now);
  const createdAt =
    existing?.created_at ?? (issue.updated_at.trim() !== "" ? issue.updated_at : now.toISOString());

  const raw: Task = {
    id: String(issue.number),
    title: issue.title,
    description: issue.body ?? "",
    status: statusFromIssue(issue, existing),
    type: existing?.type ?? "feature",
    labels: issue.labels.map((l) => l.name),
    assignee: issue.assignee?.login,
    milestone: issue.milestone?.title,
    depends_on: existing?.depends_on ?? [],
    blocks: existing?.blocks ?? [],
    refs: existing?.refs ?? [],
    ai: existing?.ai,
    branch: existing?.branch,
    estimate: existing?.estimate,
    priority: existing?.priority,
    parent: existing?.parent,
    due_date: existing?.due_date,
    start_date: existing?.start_date,
    github: {
      issue_number: issue.number,
      synced_at: now.toISOString(),
      url: issue.html_url,
    },
    created_at: createdAt,
    updated_at: updatedAt,
  };

  return TaskSchema.parse(raw);
}

/**
 * Maps a Trail task to fields for `GitHubClient.updateIssue`.
 */
export function taskToIssueUpdate(task: Task): {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
} {
  const labels = [...task.labels];
  if (task.priority) {
    const priorityLabel = `priority:${task.priority}`;
    if (!labels.includes(priorityLabel)) {
      labels.push(priorityLabel);
    }
  }

  const state: "open" | "closed" =
    task.status === "done" || task.status === "cancelled" ? "closed" : "open";

  return {
    title: task.title,
    body: task.description ?? "",
    state,
    labels,
  };
}
