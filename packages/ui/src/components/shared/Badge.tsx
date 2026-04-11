import { cn } from "@/lib/cn";
import {
  PRIORITY_COLORS,
  TYPE_COLORS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import type { TaskPriority, TaskType, TaskStatus } from "@/types/task";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={PRIORITY_COLORS[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function TypeBadge({ type }: { type: TaskType }) {
  return <Badge className={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Badge>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>;
}
