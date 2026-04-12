import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

import { STATUS_ORDER } from "@/lib/constants";
import { useUpdateTask } from "@/api/hooks";
import type { Task, TaskStatus } from "@/types/task";
import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

const PRIORITY_RANK: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };

function sortByPriority(a: Task, b: Task): number {
  const pa = a.priority ? (PRIORITY_RANK[a.priority] ?? 99) : 99;
  const pb = b.priority ? (PRIORITY_RANK[b.priority] ?? 99) : 99;
  if (pa !== pb) return pa - pb;
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  showCancelled: boolean;
}

export function KanbanBoard({ tasks, onTaskClick, showCancelled }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const columns: TaskStatus[] = showCancelled
    ? [...STATUS_ORDER, "cancelled"]
    : STATUS_ORDER;

  const tasksByStatus = new Map<TaskStatus, Task[]>();
  for (const col of columns) {
    tasksByStatus.set(col, []);
  }
  for (const task of tasks) {
    const bucket = tasksByStatus.get(task.status);
    if (bucket) {
      bucket.push(task);
    }
  }
  for (const bucket of tasksByStatus.values()) {
    bucket.sort(sortByPriority);
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : undefined;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function resolveDropStatus(overId: string | undefined): TaskStatus | null {
    if (!overId) return null;
    if (columns.includes(overId as TaskStatus)) {
      return overId as TaskStatus;
    }
    const hit = tasks.find((t) => t.id === overId);
    return hit ? hit.status : null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = resolveDropStatus(String(over.id));
    const task = tasks.find((t) => t.id === taskId);
    if (!task || newStatus === null || task.status === newStatus) return;

    if (columns.includes(newStatus)) {
      updateTask.mutate({ id: taskId, data: { status: newStatus } });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus.get(status) ?? []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onClick={() => {}} overlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
