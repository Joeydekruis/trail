import { BOARD_COLUMN_META } from "./columns.js";
import type { IssueDetailComment } from "./comments.js";
import { priorityDisplay } from "./priority.js";
import type { IssueCacheRecord } from "./types.js";

export type IssueDetailFromCache = {
  issue: string;
  title: string;
  status: string;
  statusTone: "mint" | "blue" | "gray";
  labels: Array<{ text: string; tone: "blue" | "mint" | "gray" }>;
  prioLabel: string;
  prioColor: string;
  by: string;
  adr: string;
  pr: string;
  syncLabel: string;
  desc: string;
  steps: Array<{ text: string; done: boolean }>;
  nComments: number;
  comments: IssueDetailComment[];
  activity: [];
  cta: string;
  htmlUrl: string;
};

function columnStatusTone(tone: string): IssueDetailFromCache["statusTone"] {
  if (tone === "mint") {
    return "mint";
  }
  if (tone === "blue" || tone === "violet") {
    return "blue";
  }
  return "gray";
}

function labelTone(name: string): "blue" | "mint" | "gray" {
  const lower = name.toLowerCase();
  if (lower.includes("bug") || lower.includes("fix")) {
    return "mint";
  }
  if (lower.includes("feature")) {
    return "blue";
  }
  return "gray";
}

export function issueRecordToDetail(
  record: IssueCacheRecord,
  options?: { comments?: IssueDetailComment[] },
): IssueDetailFromCache {
  const comments = options?.comments ?? [];
  const column = BOARD_COLUMN_META[record.boardColumn];
  const display = priorityDisplay(record.priority);
  const description = record.body?.trim() || "No description on GitHub.";
  return {
    issue: `#${record.number}`,
    title: record.title,
    status: record.state === "closed" ? "Done" : column.name,
    statusTone: columnStatusTone(column.tone),
    labels: record.labels.map((text) => ({ text, tone: labelTone(text) })),
    prioLabel: display.label,
    prioColor: display.color,
    by: "—",
    adr: "—",
    pr: "—",
    syncLabel: "Synced",
    desc: description,
    steps: [],
    nComments: comments.length,
    comments,
    activity: [],
    cta: "Start in worktree",
    htmlUrl: record.htmlUrl,
  };
}