import { useMemo, useState } from "react";
import type { Task } from "@/types/task";
import {
  EMPTY_FILTERS,
  FilterBar,
  applyFilters,
  type Filters,
} from "@/components/filters/FilterBar";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type View = "kanban" | "list";

interface AppLayoutProps {
  tasks: Task[];
  repoUrl: string | null;
  onNewTask: () => void;
  onSelectTask: (taskId: string) => void;
  children: (view: View, filteredTasks: Task[]) => React.ReactNode;
}

export function AppLayout({
  tasks,
  repoUrl,
  onNewTask,
  onSelectTask,
  children,
}: AppLayoutProps) {
  const [activeView, setActiveView] = useState<View>("kanban");
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0f1a] text-[#e2e8f0]">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
        openCount={openCount}
        closedCount={closedCount}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          onNewTask={onNewTask}
          repoUrl={repoUrl}
          onSearchSelect={onSelectTask}
        />

        <main className="flex-1 overflow-auto p-4">
          <div className="mb-4">
            <FilterBar filters={filters} onChange={setFilters} tasks={tasks} />
          </div>
          {children(activeView, filteredTasks)}
        </main>
      </div>
    </div>
  );
}
