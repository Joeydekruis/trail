import { useMemo, useState } from "react";
import type { DocTreeEntry } from "@/types/document";
import type { Task } from "@/types/task";
import {
  EMPTY_FILTERS,
  FilterBar,
  applyFilters,
  type Filters,
} from "@/components/filters/FilterBar";
import { Sidebar, type AppView } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  tasks: Task[];
  repoUrl: string | null;
  onNewTask: () => void;
  onSelectTask: (taskId: string) => void;
  onSync: () => void;
  syncPending: boolean;
  syncDisabled: boolean;
  lastSyncedAt: string | null;
  docTree: DocTreeEntry[];
  selectedDocPath: string | null;
  onSelectDoc: (path: string) => void;
  onClearDoc: () => void;
  onCreateDoc: (folder?: string) => void;
  onCreateFolder: (parentFolder?: string) => void;
  children: (view: AppView, filteredTasks: Task[]) => React.ReactNode;
}

export function AppLayout({
  activeView,
  onViewChange,
  tasks,
  repoUrl,
  onNewTask,
  onSelectTask,
  onSync,
  syncPending,
  syncDisabled,
  lastSyncedAt,
  docTree,
  selectedDocPath,
  onSelectDoc,
  onClearDoc,
  onCreateDoc,
  onCreateFolder,
  children,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const filteredTasks = useMemo(
    () => applyFilters(tasks, filters),
    [tasks, filters],
  );

  const openCount = filteredTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled",
  ).length;
  const closedCount = filteredTasks.length - openCount;

  const showTaskFilters =
    selectedDocPath === null && activeView !== "settings";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onViewChange={onViewChange}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        openCount={openCount}
        closedCount={closedCount}
        docTree={docTree}
        selectedDocPath={selectedDocPath}
        onSelectDoc={onSelectDoc}
        onClearDoc={onClearDoc}
        onCreateDoc={onCreateDoc}
        onCreateFolder={onCreateFolder}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          tasks={tasks}
          onNewTask={onNewTask}
          repoUrl={repoUrl}
          onSearchSelect={onSelectTask}
          onSync={onSync}
          syncPending={syncPending}
          syncDisabled={syncDisabled}
          lastSyncedAt={lastSyncedAt}
        />

        <main className="flex-1 overflow-auto p-4">
          {showTaskFilters ? (
            <div className="mb-4">
              <FilterBar filters={filters} onChange={setFilters} tasks={tasks} />
            </div>
          ) : null}
          {children(activeView, filteredTasks)}
        </main>
      </div>
    </div>
  );
}
