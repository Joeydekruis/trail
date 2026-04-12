import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ListView } from "@/components/list/ListView";
import { TaskDrawer } from "@/components/task/TaskDrawer";
import { TaskForm } from "@/components/task/TaskForm";
import { ToastProvider } from "@/components/shared/Toast";
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
        tasks={tasks}
        repoUrl={repoUrl}
        onNewTask={() => setShowCreateModal(true)}
        onSelectTask={setSelectedTaskId}
        onSync={() => syncMutation.mutate()}
        syncPending={syncMutation.isPending}
        syncDisabled={syncDisabled}
        lastSyncedAt={lastFullSyncAt}
      >
        {(view, filteredTasks) => (
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-xs text-[#8b9cb6]">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="accent-blue-500"
              />
              Show cancelled
            </label>

            {view === "kanban" ? (
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
        )}
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
      />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}
