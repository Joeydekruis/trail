import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/shared/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
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

  const showResults = open && debouncedQuery.trim().length > 0;

  return (
    <Popover open={showResults} onOpenChange={setOpen}>
      <div ref={rootRef} className="relative">
        <PopoverAnchor asChild>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Search tasks..."
              className="w-56 py-1.5 pl-8 pr-8"
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                className="absolute right-1 top-1/2 z-10 h-7 w-7 -translate-y-1/2"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  setDebouncedQuery("");
                  setOpen(false);
                  inputRef.current?.focus();
                }}
              >
                <X size={14} />
              </Button>
            )}
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] p-1"
          align="end"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No tasks found
            </div>
          ) : (
            <ul className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
              {results.map((task) => (
                <li key={task.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-sm font-normal"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(task.id)}
                  >
                    <TypeBadge type={task.type} />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {task.title}
                    </span>
                    <StatusBadge status={task.status} />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </div>
    </Popover>
  );
}
