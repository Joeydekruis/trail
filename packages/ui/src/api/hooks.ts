import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { api, type TaskWriteResponse } from "./client";
import type { DocTreeEntry } from "@/types/document";
import type { Task, TrailConfig, TrailConfigPayload } from "@/types/task";

export function useTasks(pollIntervalMs: number) {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await api.getTasks();
      return res.tasks;
    },
    refetchInterval: pollIntervalMs > 0 ? pollIntervalMs : false,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.getTask(id);
      return res.task;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation<TaskWriteResponse, Error, Record<string, unknown>>({
    mutationFn: (data) => api.createTask(data),
    onSuccess: (res) => {
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        const list = old ?? [];
        const idx = list.findIndex((t) => t.id === res.task.id);
        if (idx >= 0) {
          const next = [...list];
          next[idx] = res.task;
          return next;
        }
        return [...list, res.task];
      });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

function patchTask(task: Task, data: Record<string, unknown>): Task {
  return {
    ...task,
    ...data,
    id: task.id,
    created_at: task.created_at,
    updated_at: new Date().toISOString(),
  } as Task;
}

function setTaskInCaches(queryClient: QueryClient, id: string, next: Task) {
  queryClient.setQueryData<Task[]>(["tasks"], (old) => {
    const list = old ?? [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) return list;
    const updated = [...list];
    updated[idx] = next;
    return updated;
  });
  queryClient.setQueryData<Task | null | undefined>(["tasks", id], (old) =>
    old ? next : old,
  );
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<
    TaskWriteResponse,
    Error,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ id, data }) => api.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previous = queryClient.getQueryData<Task[]>(["tasks"]);
      const previousTask = queryClient.getQueryData<Task | null | undefined>([
        "tasks",
        id,
      ]);
      const list = previous ?? [];
      const current = list.find((t) => t.id === id);
      if (current) {
        setTaskInCaches(queryClient, id, patchTask(current, data));
      }
      return { previous, previousTask };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["tasks"], context.previous);
      }
      if (context?.previousTask !== undefined) {
        queryClient.setQueryData(["tasks", id], context.previousTask);
      }
    },
    onSuccess: (res) => {
      setTaskInCaches(queryClient, res.task.id, res.task);
    },
    onSettled: (_data, error) => {
      if (error) {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: () => api.getConfig(),
    staleTime: 60_000,
  });
}

export function useUpdateConfig() {
  const queryClient = useQueryClient();
  return useMutation<
    TrailConfigPayload,
    Error,
    { github?: TrailConfig["github"]; sync?: TrailConfig["sync"] }
  >({
    mutationFn: (data) => api.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

export function useSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}

export function useAssignees() {
  return useQuery({
    queryKey: ["assignees"],
    queryFn: async () => {
      const res = await api.getAssignees();
      return res.assignees;
    },
    staleTime: 5 * 60_000,
  });
}

export function useTaskComments(taskId: string, linkedToGitHub: boolean) {
  return useQuery({
    queryKey: ["tasks", taskId, "comments"],
    queryFn: async () => {
      const res = await api.getTaskComments(taskId);
      return res.comments;
    },
    enabled: linkedToGitHub,
    staleTime: 30_000,
  });
}

export function useCreateTaskComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.createTaskComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "comments"] });
    },
  });
}

export function useDocs(pollIntervalMs: number) {
  return useQuery({
    queryKey: ["docs"],
    queryFn: async () => {
      const res = await api.getDocs();
      return { docs: res.docs, tree: res.tree };
    },
    refetchInterval: pollIntervalMs > 0 ? pollIntervalMs : false,
  });
}

export function useDocTree(pollIntervalMs: number): DocTreeEntry[] {
  const { data } = useDocs(pollIntervalMs);
  return data?.tree ?? [];
}

export function useDoc(path: string | null) {
  return useQuery({
    queryKey: ["docs", path],
    queryFn: async () => {
      if (!path) return null;
      const res = await api.getDoc(path);
      return res.doc;
    },
    enabled: !!path,
  });
}

export function useCreateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title?: string;
      path?: string;
      content?: string;
      icon?: string;
      folder?: string;
    }) => api.createDoc(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    },
  });
}

export function useCreateDocFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { path: string; name?: string; icon?: string }) =>
      api.createDocFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    },
  });
}

export function useUpdateDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      path,
      data,
    }: {
      path: string;
      data: { content?: string; path?: string };
    }) => api.updateDoc(path, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.setQueryData(["docs", res.doc.path], res.doc);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => api.deleteDoc(path),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["docs"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
