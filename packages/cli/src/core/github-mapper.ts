import type { GitHubIssue } from "./github-types.js";
import {
  composeIssueBody,
  metaFromTask,
  parseIssueBody,
  priorityFromLabels,
  stripTrailManagedLabels,
  type TrailIssueMeta,
} from "./issue-body.js";
import { TaskSchema, type Task } from "../schemas/task.js";

function statusFromIssue(
  issue: GitHubIssue,
  meta: TrailIssueMeta,
  existing: Task | null,
): Task["status"] {
  if (issue.state === "closed") {
    return "done";
  }

  if (meta.status !== undefined && meta.status !== "draft") {
    return meta.status;
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
 * Maps a GitHub issue to a Trail task.
 * Issue body = human description + `<!-- trail:v1 -->` JSON metadata block.
 * GitHub also wins for title, labels (minus trail-managed), assignee, milestone.
 */
export function issueToTask(
  issue: GitHubIssue,
  existing: Task | null,
  now: Date,
): Task {
  const updatedAt = parseIssueTimestamp(issue, now);
  const createdAt =
    existing?.created_at ??
    (issue.updated_at.trim() !== "" ? issue.updated_at : now.toISOString());

  const labelNames = issue.labels.map((l) => l.name);
  const { description, meta } = parseIssueBody(issue.body);

  const raw: Task = {
    id: String(issue.number),
    title: issue.title,
    description,
    status: statusFromIssue(issue, meta, existing),
    type: meta.type ?? existing?.type ?? "feature",
    labels: stripTrailManagedLabels(labelNames),
    assignee: issue.assignee?.login,
    milestone: issue.milestone?.title,
    depends_on: meta.depends_on ?? existing?.depends_on ?? [],
    blocks: meta.blocks ?? existing?.blocks ?? [],
    refs: meta.refs ?? existing?.refs ?? [],
    ai: meta.ai ?? existing?.ai,
    branch: meta.branch ?? existing?.branch,
    estimate: meta.estimate ?? existing?.estimate,
    priority:
      meta.priority ?? priorityFromLabels(labelNames) ?? existing?.priority,
    parent: meta.parent !== undefined ? meta.parent : existing?.parent,
    due_date: meta.due_date ?? existing?.due_date,
    start_date: meta.start_date ?? existing?.start_date,
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
 * Body = UI description + trail metadata block.
 */
export function taskToIssueUpdate(task: Task): {
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
  assignees?: string[];
} {
  const labels = stripTrailManagedLabels([...task.labels]);
  if (task.priority) {
    const priorityLabel = `priority:${task.priority}`;
    if (!labels.includes(priorityLabel)) {
      labels.push(priorityLabel);
    }
  }

  const state: "open" | "closed" =
    task.status === "done" || task.status === "cancelled" ? "closed" : "open";

  const assignees = task.assignee?.trim()
    ? [task.assignee.trim()]
    : [];

  const body = composeIssueBody(task.description ?? "", metaFromTask(task));

  return {
    title: task.title,
    body,
    state,
    labels,
    assignees,
  };
}
