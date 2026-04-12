import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/shared/Badge";
import type { Task } from "@/types/task";

interface SearchBarProps {
  tasks: Task[];
  onSelect: (taskId: string) => void;
}

const DEBOUNCE_MS = 200;
const MAX_RESULTS = 10;

function taskMatchesQuery(task: Task, q: string): boolean {
  const lower = q.toLowerCase();
  if (task.id.toLowerCase().includes(lower)) return true;
  if (task.title.toLowerCase().includes(lower)) return true;
  if (task.description?.toLowerCase().includes(lower)) return true;
  if (task.assignee?.toLowerCase().includes(lower)) return true;
  for (const label of task.labels) {
    if (label.toLowerCase().includes(lower)) return true;
  }
  return false;
}

export function SearchBar({ tasks, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return [];
    return tasks.filter((t) => taskMatchesQuery(t, trimmed)).slice(0, MAX_RESULTS);
  }, [tasks, debouncedQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) setOpen(false);
  }, [debouncedQuery]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const handleSelect = useCallback(
    (taskId: string) => {
      onSelect(taskId);
      setQuery("");
      setDebouncedQuery("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  const showDropdown = open && debouncedQuery.trim().length > 0;

  return (
    <div ref={rootRef} className="relative">
      <Search size={16} className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#8b9cb6]" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Search tasks..."
        className="w-56 rounded-md border border-[#1e2d3d] bg-[#111827] py-1.5 pl-8 pr-8 text-sm text-[#e2e8f0] placeholder-[#8b9cb6]/50 focus:border-blue-500 focus:outline-none"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setQuery("");
            setDebouncedQuery("");
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {query.trim().length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-[#8b9cb6] hover:bg-[#1e2d3d] hover:text-[#e2e8f0]"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQuery("");
            setDebouncedQuery("");
            setOpen(false);
            inputRef.current?.focus();
          }}
        >
          <X size={14} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-80 w-[min(100vw-2rem,22rem)] overflow-y-auto rounded-md border border-[#1e2d3d] bg-[#111827] py-1 shadow-lg">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-[#8b9cb6]">No tasks found</div>
          ) : (
            <ul className="flex flex-col gap-0.5 p-1">
              {results.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-[#e2e8f0] hover:bg-[#1e2d3d]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(task.id)}
                  >
                    <TypeBadge type={task.type} />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                    <StatusBadge status={task.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
