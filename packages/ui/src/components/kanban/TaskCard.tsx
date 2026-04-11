import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Link, ClipboardList, Timer } from "lucide-react";

import { cn } from "@/lib/cn";
import { ESTIMATE_LABELS } from "@/lib/constants";
import { acceptanceCriteriaProgress } from "@/lib/utils";
import { TypeBadge, PriorityBadge } from "@/components/shared/Badge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import type { Task } from "@/types/task";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  overlay?: boolean;
}

export function TaskCard({ task, onClick, overlay }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const progress = acceptanceCriteriaProgress(task.ai?.acceptance_criteria);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab rounded-lg border border-[#1e2d3d] bg-[#111827] p-3 hover:bg-[#1a2332]",
        isDragging && "opacity-50",
        overlay && "rotate-2 shadow-xl shadow-black/50",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeBadge type={task.type} />
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="rounded p-0.5 text-[#8b9cb6] hover:bg-[#1e2d3d] hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-white">
        {task.title}
      </h3>

      {(task.assignee || task.github) && (
        <div className="mb-2 flex items-center gap-2 text-xs text-[#8b9cb6]">
          {task.assignee && (
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e2d3d] text-[10px] font-medium text-white">
                {task.assignee[0]?.toUpperCase()}
              </span>
              <span className="truncate">{task.assignee}</span>
            </div>
          )}
          {task.github && (
            <a
              href={task.github.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-blue-400 hover:underline"
            >
              #{task.github.issue_number}
            </a>
          )}
        </div>
      )}

      {progress && (
        <div className="mb-2">
          <ProgressBar percent={progress.percent} showLabel />
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-[#8b9cb6]">
        {task.depends_on.length > 0 && (
          <span className="flex items-center gap-1">
            <Link className="h-3 w-3" />
            {task.depends_on.length}
          </span>
        )}
        {progress && (
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            {progress.done}/{progress.total}
          </span>
        )}
        {task.estimate && (
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {ESTIMATE_LABELS[task.estimate]}
          </span>
        )}
      </div>
    </div>
  );
}
