import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTasks, useConfig } from "@/api/hooks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  },
});

function AppContent() {
  const { data: tasks = [] } = useTasks();
  const { data: config } = useConfig();
  const [_selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [_showCreateModal, setShowCreateModal] = useState(false);

  const repoUrl = config
    ? `https://github.com/${config.github.owner}/${config.github.repo}`
    : null;

  return (
    <AppLayout
      tasks={tasks}
      repoUrl={repoUrl}
      onNewTask={() => setShowCreateModal(true)}
      onSelectTask={(id) => setSelectedTaskId(id)}
    >
      {(view) => (
        <div className="text-[#8b9cb6] text-sm">
          View: {view} — {tasks.length} tasks loaded
        </div>
      )}
    </AppLayout>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
