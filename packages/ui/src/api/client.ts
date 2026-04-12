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

export const api = {
  getTasks: () => request<{ tasks: import("@/types/task").Task[] }>("/tasks"),
  getTask: (id: string) =>
    request<{ task: import("@/types/task").Task }>(`/tasks/${id}`),
  createTask: (data: Record<string, unknown>) =>
    request<{ task: import("@/types/task").Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Record<string, unknown>) =>
    request<{ task: import("@/types/task").Task }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ deleted: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  getConfig: () =>
    request<{
      config: import("@/types/task").TrailConfig;
      last_full_sync_at: string | null;
    }>("/config"),
  sync: () =>
    request<{ ok: boolean; last_full_sync_at: string }>("/sync", {
      method: "POST",
    }),
  getRepoFile: (filePath: string) =>
    request<{ path: string; content: string }>(
      `/repo-file?path=${encodeURIComponent(filePath)}`,
    ),
};
