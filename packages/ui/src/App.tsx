import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import type { AppView } from "@/components/layout/Sidebar";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ListView } from "@/components/list/ListView";
import { TaskDrawer } from "@/components/task/TaskDrawer";
import { TaskForm } from "@/components/task/TaskForm";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ToastProvider } from "@/components/shared/Toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTasks, useConfig, useSync } from "@/api/hooks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  },
});

function AppContent() {
  const { data: configPayload } = useConfig();
  const config = configPayload?.config;
  const lastFullSyncAt = configPayload?.last_full_sync_at ?? null;
  const pollMs = Math.max(5, config?.sync.ui_poll_interval_seconds ?? 30) * 1000;
  const { data: tasks = [] } = useTasks(pollMs);
  const syncMutation = useSync();

  const [activeView, setActiveView] = useState<AppView>("kanban");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const repoUrl = config
    ? `https://github.com/${config.github.owner}/${config.github.repo}`
    : null;

  const syncDisabled = config?.sync.preset === "offline";

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  return (
    <>
      <AppLayout
        activeView={activeView}
        onViewChange={setActiveView}
        tasks={tasks}
        repoUrl={repoUrl}
        onNewTask={() => setShowCreateModal(true)}
        onSelectTask={setSelectedTaskId}
        onSync={() => syncMutation.mutate()}
        syncPending={syncMutation.isPending}
        syncDisabled={syncDisabled}
        lastSyncedAt={lastFullSyncAt}
      >
        {(_view, filteredTasks) =>
          activeView === "settings" ? (
            <SettingsPage />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-cancelled"
                  checked={showCancelled}
                  onCheckedChange={(checked) =>
                    setShowCancelled(checked === true)
                  }
                />
                <Label htmlFor="show-cancelled" className="cursor-pointer">
                  Show cancelled
                </Label>
              </div>

              {activeView === "kanban" ? (
                <KanbanBoard
                  tasks={filteredTasks}
                  onTaskClick={setSelectedTaskId}
                  showCancelled={showCancelled}
                />
              ) : (
                <ListView
                  tasks={filteredTasks}
                  onTaskClick={setSelectedTaskId}
                  showCancelled={showCancelled}
                />
              )}
            </div>
          )
        }
      </AppLayout>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onNavigateTask={setSelectedTaskId}
        />
      )}

      <TaskForm
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={setSelectedTaskId}
      />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}