import type { BoardColumnId } from "./columns.js";

const STATUS_TO_COLUMN: Record<string, BoardColumnId> = {
  backlog: "backlog",
  todo: "todo",
  "in progress": "in-progress",
  "in review": "in-review",
  done: "done",
};

/** Maps a GitHub Projects v2 single-select Status value to a board column id. */
export function boardColumnFromProjectStatus(statusName: string): BoardColumnId | null {
  const key = statusName.trim().toLowerCase();
  return STATUS_TO_COLUMN[key] ?? null;
}