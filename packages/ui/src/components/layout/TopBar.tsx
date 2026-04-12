import { Plus, ExternalLink, RefreshCw } from "lucide-react";
import { SearchBar } from "@/components/filters/SearchBar";
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
    <header className="flex h-12 shrink-0 items-center border-b border-[#1e2d3d] bg-[#0a0f1a] px-4">
      <div className="min-w-0 flex-1 text-xs text-[#8b9cb6] truncate">
        {formatSynced(lastSyncedAt)}
      </div>

      <div className="flex items-center gap-3">
        <SearchBar tasks={tasks} onSelect={onSearchSelect} />

        <button
          type="button"
          onClick={onSync}
          disabled={syncDisabled || syncPending}
          title="Pull and push tasks with GitHub"
          className="flex items-center gap-1.5 rounded-md border border-[#1e2d3d] px-3 py-1.5 text-sm text-[#e2e8f0] transition-colors hover:bg-[#1a2332] disabled:pointer-events-none disabled:opacity-40"
        >
          <RefreshCw size={14} className={syncPending ? "animate-spin" : ""} />
          Sync
        </button>

        <button
          type="button"
          onClick={onNewTask}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          New Task
        </button>

        {repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-[#1e2d3d] px-3 py-1.5 text-sm text-[#8b9cb6] transition-colors hover:bg-[#1a2332] hover:text-[#e2e8f0]"
          >
            <ExternalLink size={14} />
            View Repo
          </a>
        )}

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e2d3d] text-xs text-[#8b9cb6]">
          U
        </div>
      </div>
    </header>
  );
}
