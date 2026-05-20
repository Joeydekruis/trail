const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}

export type TaskWriteResponse = {
  task: import("@/types/task").Task;
  warning?: string;
};

export const api = {
  getTasks: () => request<{ tasks: import("@/types/task").Task[] }>("/tasks"),
  getTask: (id: string) =>
    request<{ task: import("@/types/task").Task }>(`/tasks/${id}`),
  createTask: (data: Record<string, unknown>) =>
    request<TaskWriteResponse>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Record<string, unknown>) =>
    request<TaskWriteResponse>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ deleted: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  getConfig: () =>
    request<import("@/types/task").TrailConfigPayload>("/config"),
  updateConfig: (data: {
    github?: import("@/types/task").TrailConfig["github"];
    sync?: import("@/types/task").TrailConfig["sync"];
  }) =>
    request<import("@/types/task").TrailConfigPayload>("/config", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  sync: () =>
    request<{ ok: boolean; last_full_sync_at: string }>("/sync", {
      method: "POST",
    }),
  getRepoFile: (filePath: string) =>
    request<{ path: string; content: string }>(
      `/repo-file?path=${encodeURIComponent(filePath)}`,
    ),
  getAssignees: () =>
    request<{ assignees: string[] }>("/assignees"),
  getTaskComments: (taskId: string) =>
    request<{ comments: import("@/types/comment").TaskComment[] }>(
      `/tasks/${taskId}/comments`,
    ),
  createTaskComment: (taskId: string, body: string) =>
    request<{ comment: import("@/types/comment").TaskComment }>(
      `/tasks/${taskId}/comments`,
      { method: "POST", body: JSON.stringify({ body }) },
    ),
  getDocs: () =>
    request<{
      docs: import("@/types/document").TrailDocumentMeta[];
      tree: import("@/types/document").DocTreeEntry[];
    }>("/docs"),
  getDoc: (docPath: string) =>
    request<{ doc: import("@/types/document").TrailDocument }>(
      `/docs/file?path=${encodeURIComponent(docPath)}`,
    ),
  createDoc: (data: {
    title?: string;
    path?: string;
    content?: string;
    icon?: string;
    folder?: string;
  }) =>
    request<{ doc: import("@/types/document").TrailDocument }>("/docs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  createDocFolder: (data: { path: string; name?: string; icon?: string }) =>
    request<{ folder: import("@/types/document").TrailDocFolder }>(
      "/docs/folders",
      { method: "POST", body: JSON.stringify(data) },
    ),
  updateDoc: (
    docPath: string,
    data: { content?: string; path?: string; title?: string; icon?: string },
  ) =>
    request<{ doc: import("@/types/document").TrailDocument }>(
      `/docs/file?path=${encodeURIComponent(docPath)}`,
      { method: "PATCH", body: JSON.stringify(data) },
    ),
  deleteDoc: (docPath: string) =>
    request<{ deleted: boolean }>(
      `/docs/file?path=${encodeURIComponent(docPath)}`,
      { method: "DELETE" },
    ),
};
