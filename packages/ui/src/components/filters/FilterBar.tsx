import { X } from "lucide-react";
import { useMemo } from "react";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TYPE_LABELS,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SELECT_NONE } from "@/components/shared/FormField";
import type { Task, TaskPriority, TaskType } from "@/types/task";

export interface Filters {
  assignee: string | null;
  priority: TaskPriority | null;
  type: TaskType | null;
  label: string | null;
  milestone: string | null;
}

export const EMPTY_FILTERS: Filters = {
  assignee: null,
  priority: null,
  type: null,
  label: null,
  milestone: null,
};

export function applyFilters(tasks: Task[], filters: Filters): Task[] {
  return tasks.filter((task) => {
    if (filters.assignee !== null && task.assignee !== filters.assignee) return false;
    if (filters.priority !== null && task.priority !== filters.priority) return false;
    if (filters.type !== null && task.type !== filters.type) return false;
    if (filters.label !== null && !task.labels.includes(filters.label)) return false;
    if (filters.milestone !== null && task.milestone !== filters.milestone) return false;
    return true;
  });
}

function uniqueSorted(values: (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value ?? SELECT_NONE}
      onValueChange={(v) => onChange(v === SELECT_NONE ? null : v)}
    >
      <SelectTrigger size="sm" className="min-w-[7rem]" aria-label={`Filter by ${label}`}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        <SelectItem value={SELECT_NONE}>{label}</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  tasks: Task[];
}

export function FilterBar({ filters, onChange, tasks }: FilterBarProps) {
  const assignees = useMemo(
    () => uniqueSorted(tasks.map((t) => t.assignee)),
    [tasks],
  );
  const labels = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      for (const l of t.labels) set.add(l);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [tasks]);
  const milestones = useMemo(
    () => uniqueSorted(tasks.map((t) => t.milestone)),
    [tasks],
  );

  const priorities = PRIORITY_ORDER;
  const types = useMemo(() => (Object.keys(TYPE_LABELS) as TaskType[]).sort(), []);

  const hasActive =
    filters.assignee !== null ||
    filters.priority !== null ||
    filters.type !== null ||
    filters.label !== null ||
    filters.milestone !== null;

  const chipClass =
    "inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-blue-500 dark:text-blue-400";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Assignee"
          value={filters.assignee}
          onChange={(assignee) => onChange({ ...filters, assignee })}
          options={assignees.map((a) => ({ value: a, label: a }))}
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(priority) =>
            onChange({
              ...filters,
              priority: priority as TaskPriority | null,
            })
          }
          options={priorities.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
          }))}
        />
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(type) =>
            onChange({ ...filters, type: type as TaskType | null })
          }
          options={types.map((ty) => ({
            value: ty,
            label: TYPE_LABELS[ty],
          }))}
        />
        <FilterSelect
          label="Label"
          value={filters.label}
          onChange={(label) => onChange({ ...filters, label })}
          options={labels.map((l) => ({ value: l, label: l }))}
        />
        <FilterSelect
          label="Milestone"
          value={filters.milestone}
          onChange={(milestone) => onChange({ ...filters, milestone })}
          options={milestones.map((m) => ({ value: m, label: m }))}
        />
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.assignee !== null && (
            <span className={chipClass}>
              Assignee: {filters.assignee}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove assignee filter"
                className="size-5 text-blue-500 dark:text-blue-400"
                onClick={() => onChange({ ...filters, assignee: null })}
              >
                <X size={12} />
              </Button>
            </span>
          )}
          {filters.priority !== null && (
            <span className={chipClass}>
              Priority: {PRIORITY_LABELS[filters.priority]}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove priority filter"
                className="size-5 text-blue-500 dark:text-blue-400"
                onClick={() => onChange({ ...filters, priority: null })}
              >
                <X size={12} />
              </Button>
            </span>
          )}
          {filters.type !== null && (
            <span className={chipClass}>
              Type: {TYPE_LABELS[filters.type]}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove type filter"
                className="size-5 text-blue-500 dark:text-blue-400"
                onClick={() => onChange({ ...filters, type: null })}
              >
                <X size={12} />
              </Button>
            </span>
          )}
          {filters.label !== null && (
            <span className={chipClass}>
              Label: {filters.label}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove label filter"
                className="size-5 text-blue-500 dark:text-blue-400"
                onClick={() => onChange({ ...filters, label: null })}
              >
                <X size={12} />
              </Button>
            </span>
          )}
          {filters.milestone !== null && (
            <span className={chipClass}>
              Milestone: {filters.milestone}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove milestone filter"
                className="size-5 text-blue-500 dark:text-blue-400"
                onClick={() => onChange({ ...filters, milestone: null })}
              >
                <X size={12} />
              </Button>
            </span>
          )}

          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-blue-500 dark:text-blue-400"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
