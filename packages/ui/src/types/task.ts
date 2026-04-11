export type TaskStatus =
  | "draft"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled";

export type TaskPriority = "p0" | "p1" | "p2" | "p3";

export type TaskType = "feature" | "bug" | "chore" | "epic";

export type TaskEstimate = "xs" | "sm" | "md" | "lg" | "xl";

export interface TaskGitHub {
  issue_number: number;
  synced_at: string;
  url: string;
}

export interface TaskAi {
  summary?: string;
  acceptance_criteria?: string[];
  implementation_context?: string[];
  test_strategy?: string[];
  constraints?: string[];
}

export interface TaskRef {
  type: string;
  path: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  type: TaskType;
  assignee?: string;
  milestone?: string;
  branch?: string;
  labels: string[];
  parent?: string | null;
  depends_on: string[];
  blocks: string[];
  due_date?: string;
  start_date?: string;
  estimate?: TaskEstimate;
  github?: TaskGitHub | null;
  refs: TaskRef[];
  ai?: TaskAi;
  created_at: string;
  updated_at: string;
}

export interface TrailConfig {
  github: { owner: string; repo: string };
  sync: {
    preset: "collaborative" | "solo" | "offline";
    auto_sync_on_command: boolean;
    ui_poll_interval_seconds: number;
    ui_idle_backoff: boolean;
  };
}
