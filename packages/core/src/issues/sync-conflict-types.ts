import type { BoardColumnId } from "./columns.js";

export type IssueSyncConflictSide = {
  state: string;
  boardColumn: BoardColumnId;
  labels: string[];
  assigneeLogin: string | null;
  updatedAt: string;
};

export type IssueSyncConflictRecord = {
  workspaceId: string;
  issueNumber: number;
  title: string;
  github: IssueSyncConflictSide;
  trail: IssueSyncConflictSide;
  detectedAt: string;
};

export type SyncConflictField = "state" | "boardColumn" | "labels" | "assignee";

export type SyncConflictResolutionPicks = Partial<
  Record<SyncConflictField, "github" | "trail">
>;