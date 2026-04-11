import { useMemo, useState } from "react";
import { ArrowUpDown, Link } from "lucide-react";

import { cn } from "@/lib/cn";
import { TypeBadge, PriorityBadge, StatusBadge, Badge } from "@/components/shared/Badge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { relativeTime, acceptanceCriteriaProgress } from "@/lib/utils";
import { ESTIMATE_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

export interface ListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  showCancelled: boolean;
}

type SortField = "priority" | "title" | "status" | "assignee" | "updated";
type SortDir = "asc" | "desc";

const GRID_COLS =
  "grid-cols-[60px_50px_1fr_120px_120px_100px_60px_60px_100px]";

const PRIORITY_RANK: Record<TaskPriority, number> = {
  p0: 0,
  p1: 1,
  p2: 2,
  p3: 3,
};

function prioritySortValue(priority: TaskPriority | undefined): number {
  return priority === undefined ? 999 : PRIORITY_RANK[priority];
}

function statusSortValue(status: TaskStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx >= 0) return idx;
  return STATUS_ORDER.length;
}

const DEFAULT_DIR_FOR_FIELD: Record<SortField, SortDir> = {
  priority: "asc",
  title: "asc",
  status: "asc",
  assignee: "asc",
  updated: "desc",
};

function compareTasks(
  a: Task,
  b: Task,
  sortField: SortField,
  sortDir: SortDir,
): number {
  const dir = sortDir === "asc" ? 1 : -1;
  let cmp = 0;

  switch (sortField) {
    case "priority":
      cmp = prioritySortValue(a.priority) - prioritySortValue(b.priority);
      break;
    case "title":
      cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      break;
    case "status":
      cmp = statusSortValue(a.status) - statusSortValue(b.status);
      break;
    case "assignee":
      cmp = (a.assignee ?? "").localeCompare(b.assignee ?? "", undefined, {
        sensitivity: "base",
      });
      break;
    case "updated":
      cmp =
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      break;
    default: {
      const _exhaustive: never = sortField;
      return _exhaustive;
    }
  }

  if (cmp !== 0) return cmp * dir;
  return (
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function SortHeader({
  label,
  active,
  sortDir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  sortDir: SortDir;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-start gap-1 px-2 py-2 text-left text-xs font-medium uppercase tracking-wide",
        active ? "text-blue-400" : "text-[#8b9cb6]",
        className,
      )}
    >
      <span className="truncate">{label}</span>
      <ArrowUpDown
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          active && sortDir === "asc" && "text-blue-400",
          active && sortDir === "desc" && "text-blue-400",
        )}
        aria-hidden
      />
    </button>
  );
}

export function ListView({ tasks, onTaskClick, showCancelled }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const visibleTasks = useMemo(() => {
    const filtered = showCancelled
      ? tasks
      : tasks.filter((t) => t.status !== "cancelled");
    return [...filtered].sort((a, b) => compareTasks(a, b, sortField, sortDir));
  }, [tasks, showCancelled, sortField, sortDir]);

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(DEFAULT_DIR_FOR_FIELD[field]);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#1e2d3d]">
      <div
        className={cn(
          "sticky top-0 z-10 grid shrink-0 gap-0 border-b border-[#1e2d3d] bg-[#0d1420]",
          GRID_COLS,
        )}
      >
        <div className="flex items-center px-2 py-2 text-xs font-medium uppercase tracking-wide text-[#8b9cb6]">
          Type
        </div>
        <SortHeader
          label="Priority"
          active={sortField === "priority"}
          sortDir={sortDir}
          onClick={() => handleSortClick("priority")}
          className="justify-center"
        />
        <SortHeader
          label="Title"
          active={sortField === "title"}
          sortDir={sortDir}
          onClick={() => handleSortClick("title")}
        />
        <SortHeader
          label="Status"
          active={sortField === "status"}
          sortDir={sortDir}
          onClick={() => handleSortClick("status")}
        />
        <SortHeader
          label="Assignee"
          active={sortField === "assignee"}
          sortDir={sortDir}
          onClick={() => handleSortClick("assignee")}
        />
        <div className="flex items-center px-2 py-2 text-xs font-medium uppercase tracking-wide text-[#8b9cb6]">
          Progress
        </div>
        <div className="flex items-center justify-center px-2 py-2 text-xs font-medium uppercase tracking-wide text-[#8b9cb6]">
          Dep
        </div>
        <div className="flex items-center justify-center px-2 py-2 text-xs font-medium uppercase tracking-wide text-[#8b9cb6]">
          Est
        </div>
        <SortHeader
          label="Updated"
          active={sortField === "updated"}
          sortDir={sortDir}
          onClick={() => handleSortClick("updated")}
        />
      </div>

      <div className="max-h-[min(70vh,800px)] min-h-0 flex-1 overflow-y-auto">
        {visibleTasks.map((task) => (
          <ListRow key={task.id} task={task} onTaskClick={onTaskClick} />
        ))}
      </div>
    </div>
  );
}

function ListRow({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick: (taskId: string) => void;
}) {
  const progress = acceptanceCriteriaProgress(task.ai?.acceptance_criteria);
  const depCount = task.depends_on.length;

  return (
    <button
      type="button"
      onClick={() => onTaskClick(task.id)}
      className={cn(
        "grid w-full gap-0 border-b border-[#1e2d3d] text-left transition-colors hover:bg-[#1a2332]",
        GRID_COLS,
      )}
    >
      <div className="flex items-center justify-center px-1 py-2">
        <TypeBadge type={task.type} />
      </div>
      <div className="flex items-center justify-center px-1 py-2">
        {task.priority ? (
          <PriorityBadge priority={task.priority} />
        ) : (
          <span className="inline-block min-h-[1.25rem] w-4" />
        )}
      </div>
      <div className="flex min-w-0 items-center px-2 py-2">
        <span className="truncate text-sm text-white">
          {task.title}
          {task.github != null && (
            <span className="text-[#8b9cb6]">
              {" "}
              #{task.github.issue_number}
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center px-2 py-2">
        <StatusBadge status={task.status} />
      </div>
      <div className="flex min-w-0 items-center px-2 py-2 text-sm text-[#8b9cb6]">
        <span className="truncate">{task.assignee ?? "—"}</span>
      </div>
      <div className="flex min-w-0 items-center px-2 py-2">
        {progress ? (
          <div className="flex w-full min-w-0 items-center gap-2">
            <ProgressBar percent={progress.percent} className="min-w-0 flex-1" />
            <span className="shrink-0 text-xs text-[#8b9cb6]">
              {progress.percent}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-[#8b9cb6]">—</span>
        )}
      </div>
      <div className="flex items-center justify-center px-2 py-2 text-sm text-[#8b9cb6]">
        {depCount > 0 ? (
          <span className="flex items-center gap-1">
            <Link className="h-4 w-4 shrink-0" aria-hidden />
            {depCount}
          </span>
        ) : (
          "—"
        )}
      </div>
      <div className="flex items-center justify-center px-2 py-2">
        {task.estimate ? (
          <Badge className="bg-gray-600">{ESTIMATE_LABELS[task.estimate]}</Badge>
        ) : (
          <span className="text-sm text-[#8b9cb6]">—</span>
        )}
      </div>
      <div className="flex items-center px-2 py-2 text-sm text-[#8b9cb6]">
        {relativeTime(task.updated_at)}
      </div>
    </button>
  );
}
