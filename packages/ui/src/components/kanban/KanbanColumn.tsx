import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { cn } from "@/lib/cn";
import { STATUS_LABELS } from "@/lib/constants";
import type { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 flex-shrink-0 flex-col rounded-lg border border-[#1e2d3d] bg-[#0d1420]",
        isOver && "border-blue-500/50 bg-blue-500/5",
      )}
    >
      <div className="flex items-center justify-between border-b border-[#1e2d3d] px-3 py-2">
        <span className="text-sm font-medium text-white">
          {STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-[#1e2d3d] px-2 py-0.5 text-xs text-[#8b9cb6]">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
