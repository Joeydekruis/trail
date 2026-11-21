import type { BoardColumnId } from "./columns.js";
import type { IssuePriority } from "./priority.js";

export type IssueCacheRecord = {
  workspaceId: string;
  number: number;
  title: string;
  state: string;
  boardColumn: BoardColumnId;
  priority: IssuePriority;
  labels: string[];
  updatedAt: string;
  htmlUrl: string;
  body: string | null;
  /** GitHub user login; null when unassigned. */
  assigneeLogin: string | null;
};