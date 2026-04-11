import { X } from "lucide-react";
import { useMemo } from "react";
import {
  PRIORITY_LABELS,
  TYPE_LABELS,
} from "@/lib/constants";
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

const selectClass =
  "rounded border border-[#1e2d3d] bg-[#111827] px-2 py-1 text-xs text-[#e2e8f0] focus:border-blue-500 focus:outline-none";

function uniqueSorted(values: (string | undefined)[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
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

  const priorities = useMemo(
    () => (Object.keys(PRIORITY_LABELS) as TaskPriority[]).sort(),
    [],
  );
  const types = useMemo(() => (Object.keys(TYPE_LABELS) as TaskType[]).sort(), []);

  const hasActive =
    filters.assignee !== null ||
    filters.priority !== null ||
    filters.type !== null ||
    filters.label !== null ||
    filters.milestone !== null;

  const chipClass =
    "inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Filter by assignee"
          className={selectClass}
          value={filters.assignee ?? ""}
          onChange={(e) =>
            onChange({ ...filters, assignee: e.target.value || null })
          }
        >
          <option value="">Assignee</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by priority"
          className={selectClass}
          value={filters.priority ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              priority: v === "" ? null : (v as TaskPriority),
            });
          }}
        >
          <option value="">Priority</option>
          {priorities.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by type"
          className={selectClass}
          value={filters.type ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({
              ...filters,
              type: v === "" ? null : (v as TaskType),
            });
          }}
        >
          <option value="">Type</option>
          {types.map((ty) => (
            <option key={ty} value={ty}>
              {TYPE_LABELS[ty]}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by label"
          className={selectClass}
          value={filters.label ?? ""}
          onChange={(e) =>
            onChange({ ...filters, label: e.target.value || null })
          }
        >
          <option value="">Label</option>
          {labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by milestone"
          className={selectClass}
          value={filters.milestone ?? ""}
          onChange={(e) =>
            onChange({ ...filters, milestone: e.target.value || null })
          }
        >
          <option value="">Milestone</option>
          {milestones.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {hasActive && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.assignee !== null && (
            <span className={chipClass}>
              Assignee: {filters.assignee}
              <button
                type="button"
                aria-label="Remove assignee filter"
                className="rounded p-0.5 hover:bg-blue-500/20"
                onClick={() => onChange({ ...filters, assignee: null })}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.priority !== null && (
            <span className={chipClass}>
              Priority: {PRIORITY_LABELS[filters.priority]}
              <button
                type="button"
                aria-label="Remove priority filter"
                className="rounded p-0.5 hover:bg-blue-500/20"
                onClick={() => onChange({ ...filters, priority: null })}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.type !== null && (
            <span className={chipClass}>
              Type: {TYPE_LABELS[filters.type]}
              <button
                type="button"
                aria-label="Remove type filter"
                className="rounded p-0.5 hover:bg-blue-500/20"
                onClick={() => onChange({ ...filters, type: null })}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.label !== null && (
            <span className={chipClass}>
              Label: {filters.label}
              <button
                type="button"
                aria-label="Remove label filter"
                className="rounded p-0.5 hover:bg-blue-500/20"
                onClick={() => onChange({ ...filters, label: null })}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.milestone !== null && (
            <span className={chipClass}>
              Milestone: {filters.milestone}
              <button
                type="button"
                aria-label="Remove milestone filter"
                className="rounded p-0.5 hover:bg-blue-500/20"
                onClick={() => onChange({ ...filters, milestone: null })}
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            className="text-xs text-blue-400 underline-offset-2 hover:underline"
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
