import { Plus, ExternalLink, RefreshCw } from "lucide-react";
import { SearchBar } from "@/components/filters/SearchBar";
import { ModeToggle } from "@/components/theme/ModeToggle";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types/task";

interface TopBarProps {
  tasks: Task[];
  onNewTask: () => void;
  repoUrl: string | null;
  onSearchSelect: (taskId: string) => void;
  onSync: () => void;
  syncPending: boolean;
  syncDisabled: boolean;
  lastSyncedAt: string | null;
}

function formatSynced(iso: string | null): string {
  if (!iso) return "Never synced with GitHub";
  try {
    const d = new Date(iso);
    return `Last synced ${d.toLocaleString()}`;
  } catch {
    return "Last synced —";
  }
}

export function TopBar({
  tasks,
  onNewTask,
  repoUrl,
  onSearchSelect,
  onSync,
  syncPending,
  syncDisabled,
  lastSyncedAt,
}: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-border bg-background px-4">
      <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {formatSynced(lastSyncedAt)}
      </div>

      <div className="flex items-center gap-3">
        <SearchBar tasks={tasks} onSelect={onSearchSelect} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={syncDisabled || syncPending}
          title="Pull and push tasks with GitHub"
        >
          <RefreshCw size={14} className={syncPending ? "animate-spin" : ""} />
          Sync
        </Button>

        <Button type="button" size="sm" onClick={onNewTask}>
          <Plus size={16} />
          New Task
        </Button>

        {repoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} />
              View Repo
            </a>
          </Button>
        )}

        <ModeToggle />

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
          U
        </div>
      </div>
    </header>
  );
}
