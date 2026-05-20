import type {
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskEstimate,
  SyncPreset,
} from "@/types/task";

export const SYNC_PRESET_LABELS: Record<SyncPreset, string> = {
  collaborative: "Collaborative",
  solo: "Solo",
  offline: "Offline",
};

export const SYNC_PRESET_DESCRIPTIONS: Record<SyncPreset, string> = {
  collaborative:
    "Sync with GitHub on CLI commands and when creating or editing tasks in the UI.",
  solo: "Sync only when you run trail sync or use the UI sync button.",
  offline: "Local tasks only — no GitHub sync.",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  draft: "Draft",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

export const STATUS_ORDER: TaskStatus[] = [
  "draft",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

export const PRIORITY_ORDER: TaskPriority[] = ["p0", "p1", "p2", "p3"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  p0: "Highest",
  p1: "High",
  p2: "Medium",
  p3: "Low",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  p0: "bg-red-500",
  p1: "bg-amber-500",
  p2: "bg-blue-500",
  p3: "bg-gray-500",
};

export const TYPE_LABELS: Record<TaskType, string> = {
  feature: "Feature",
  bug: "Bug",
  chore: "Chore",
  epic: "Epic",
};

export const TYPE_COLORS: Record<TaskType, string> = {
  feature: "bg-blue-500",
  bug: "bg-red-500",
  chore: "bg-gray-500",
  epic: "bg-purple-500",
};

export const ESTIMATE_ORDER: TaskEstimate[] = ["xs", "sm", "md", "lg", "xl"];

export const ESTIMATE_LABELS: Record<TaskEstimate, string> = {
  xs: "Extra Small",
  sm: "Small",
  md: "Medium",
  lg: "Large",
  xl: "Extra Large",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  draft: "bg-gray-600",
  todo: "bg-blue-600",
  in_progress: "bg-amber-600",
  in_review: "bg-purple-600",
  done: "bg-green-600",
  cancelled: "bg-red-900",
};
