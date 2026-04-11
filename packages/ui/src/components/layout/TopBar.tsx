import { Plus, ExternalLink } from "lucide-react";
import { SearchBar } from "@/components/filters/SearchBar";

interface TopBarProps {
  onNewTask: () => void;
  repoUrl: string | null;
  onSearchSelect: (taskId: string) => void;
}

export function TopBar({ onNewTask, repoUrl, onSearchSelect }: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[#1e2d3d] bg-[#0a0f1a] px-4">
      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        <SearchBar onSelect={onSearchSelect} />

        <button
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

        {/* User avatar placeholder */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e2d3d] text-xs text-[#8b9cb6]">
          U
        </div>
      </div>
    </header>
  );
}
