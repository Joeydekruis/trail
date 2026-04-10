import type { Task, TaskStatus } from "../../schemas/task.js";
import { printJson } from "../json.js";
import { loadTrailReadContext } from "../read-context.js";

const DEFAULT_LIMIT = 25;
const HIDDEN_BY_DEFAULT = new Set<TaskStatus>(["done", "cancelled"]);

export type ListOptions = {
  all?: boolean;
  limit?: number;
  status?: string;
  label?: string;
  json?: boolean;
};

/** Shared filter/sort/limit logic for CLI list and MCP. */
export function selectTasksForList(tasks: Task[], options: ListOptions): Task[] {
  const all = options.all === true;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const statusFilter = options.status as TaskStatus | undefined;
  const labelFilter = options.label;

  let rows = tasks.filter((t) => all || !HIDDEN_BY_DEFAULT.has(t.status));
  if (statusFilter !== undefined) {
    rows = rows.filter((t) => t.status === statusFilter);
  }
  if (labelFilter !== undefined) {
    rows = rows.filter((t) => t.labels.includes(labelFilter));
  }

  rows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return rows.slice(0, limit);
}

function slimTask(t: Task) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    labels: t.labels,
  };
}

function formatTable(tasks: Task[]): void {
  const idW = Math.max(4, ...tasks.map((t) => t.id.length), 2);
  const statusW = Math.max(6, ...tasks.map((t) => t.status.length), 6);
  const header = `${"ID".padEnd(idW)}  ${"STATUS".padEnd(statusW)}  TITLE`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const t of tasks) {
    console.log(`${t.id.padEnd(idW)}  ${t.status.padEnd(statusW)}  ${t.title}`);
  }
}

export async function runList(options: ListOptions): Promise<void> {
  const { tasks } = await loadTrailReadContext(process.cwd());
  const rows = selectTasksForList(tasks, options);

  if (options.json) {
    printJson(rows.map(slimTask));
    return;
  }

  if (rows.length === 0) {
    console.log("No tasks match the filters.");
    return;
  }

  formatTable(rows);
}
