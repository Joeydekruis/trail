import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { TypeBadge, PriorityBadge, StatusBadge } from "@/components/shared/Badge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { useUpdateTask, useDeleteTask } from "@/api/hooks";
import { api } from "@/api/client";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  ESTIMATE_LABELS,
} from "@/lib/constants";
import { acceptanceCriteriaProgress } from "@/lib/utils";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskEstimate,
} from "@/types/task";

interface TaskDrawerProps {
  task: Task;
  onClose: () => void;
  onNavigateTask: (taskId: string) => void;
}

function DocPeekPanel({ path, onClose }: { path: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["repo-file", path],
    queryFn: () => api.getRepoFile(path),
  });

  return (
    <aside className="flex w-[min(380px,90vw)] flex-shrink-0 flex-col border-l border-[#1e2d3d] bg-[#0d1420]">
      <div className="flex items-center justify-between gap-2 border-b border-[#1e2d3d] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-[#8b9cb6]" />
          <span className="truncate font-mono text-xs text-[#8b9cb6]" title={path}>
            {path}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[#8b9cb6] hover:text-[#e2e8f0]"
          aria-label="Close documentation panel"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-sm text-[#8b9cb6]">Loading…</p>
        )}
        {isError && (
          <p className="text-sm text-red-400/90">
            Could not read this path from the repository.
          </p>
        )}
        {data?.content !== undefined && (
          <MarkdownBody markdown={data.content} />
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-[#8b9cb6] mb-1 block">{label}</label>
      {children}
    </div>
  );
}

export function TaskDrawer({ task, onClose, onNavigateTask }: TaskDrawerProps) {
  const [docPreviewPath, setDocPreviewPath] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
  const [editPriority, setEditPriority] = useState<TaskPriority | "">(task.priority ?? "");
  const [editType, setEditType] = useState<TaskType>(task.type);
  const [editAssignee, setEditAssignee] = useState(task.assignee ?? "");
  const [editEstimate, setEditEstimate] = useState<TaskEstimate | "">(task.estimate ?? "");
  const [editMilestone, setEditMilestone] = useState(task.milestone ?? "");
  const [editStartDate, setEditStartDate] = useState(task.start_date ?? "");
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? "");

  const [copied, setCopied] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    setDocPreviewPath(null);
    setEditTitle(task.title);
    setEditStatus(task.status);
    setEditPriority(task.priority ?? "");
    setEditType(task.type);
    setEditAssignee(task.assignee ?? "");
    setEditEstimate(task.estimate ?? "");
    setEditMilestone(task.milestone ?? "");
    setEditStartDate(task.start_date ?? "");
    setEditDueDate(task.due_date ?? "");
    setCopied(false);
    setAiOpen(false);
  }, [task]);

  const isDirty =
    editTitle !== task.title ||
    editStatus !== task.status ||
    (editPriority || undefined) !== (task.priority ?? undefined) ||
    editType !== task.type ||
    (editAssignee || undefined) !== (task.assignee ?? undefined) ||
    (editEstimate || undefined) !== (task.estimate ?? undefined) ||
    (editMilestone || undefined) !== (task.milestone ?? undefined) ||
    (editStartDate || undefined) !== (task.start_date ?? undefined) ||
    (editDueDate || undefined) !== (task.due_date ?? undefined);

  function handleUpdate() {
    const data: Record<string, unknown> = {};
    if (editTitle !== task.title) data.title = editTitle;
    if (editStatus !== task.status) data.status = editStatus;
    if ((editPriority || undefined) !== (task.priority ?? undefined))
      data.priority = editPriority || null;
    if (editType !== task.type) data.type = editType;
    if ((editAssignee || undefined) !== (task.assignee ?? undefined))
      data.assignee = editAssignee || null;
    if ((editEstimate || undefined) !== (task.estimate ?? undefined))
      data.estimate = editEstimate || null;
    if ((editMilestone || undefined) !== (task.milestone ?? undefined))
      data.milestone = editMilestone || null;
    if ((editStartDate || undefined) !== (task.start_date ?? undefined))
      data.start_date = editStartDate || null;
    if ((editDueDate || undefined) !== (task.due_date ?? undefined))
      data.due_date = editDueDate || null;
    updateTask.mutate({ id: task.id, data });
  }

  function handleMarkDone() {
    updateTask.mutate({ id: task.id, data: { status: "done" } });
  }

  function handleDelete() {
    deleteTask.mutate(task.id, { onSuccess: () => onClose() });
  }

  function handleCopyBranch() {
    if (!task.branch) return;
    navigator.clipboard.writeText(task.branch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const acProgress = acceptanceCriteriaProgress(task.ai?.acceptance_criteria);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer stack: optional doc panel (left) + task panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-row">
        {docPreviewPath ? (
          <DocPeekPanel path={docPreviewPath} onClose={() => setDocPreviewPath(null)} />
        ) : null}
        <div className="flex w-[min(420px,100vw)] flex-col border-l border-[#1e2d3d] bg-[#111827]">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TypeBadge type={task.type} />
                {task.priority && <PriorityBadge priority={task.priority} />}
              </div>
              <button
                onClick={onClose}
                className="text-[#8b9cb6] hover:text-[#e2e8f0]"
              >
                <X size={18} />
              </button>
            </div>

            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-transparent text-lg font-semibold text-[#e2e8f0] outline-none border-b border-transparent focus:border-blue-500 pb-1"
            />

            <div className="flex items-center gap-2">
              {task.assignee && (
                <>
                  <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400">
                    {task.assignee[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-[#8b9cb6]">{task.assignee}</span>
                </>
              )}
              <StatusBadge status={task.status} />
              {task.github?.url && (
                <a
                  href={task.github.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-[#8b9cb6] hover:text-blue-400"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                className="field-select"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as TaskPriority | "")}
                className="field-select"
              >
                <option value="">None</option>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Type">
              <select
                value={editType}
                onChange={(e) => setEditType(e.target.value as TaskType)}
                className="field-select"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Assignee">
              <input
                type="text"
                value={editAssignee}
                onChange={(e) => setEditAssignee(e.target.value)}
                placeholder="Unassigned"
                className="field-input"
              />
            </Field>

            <Field label="Estimate">
              <select
                value={editEstimate}
                onChange={(e) => setEditEstimate(e.target.value as TaskEstimate | "")}
                className="field-select"
              >
                <option value="">None</option>
                {Object.entries(ESTIMATE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>

            <Field label="Milestone">
              <input
                type="text"
                value={editMilestone}
                onChange={(e) => setEditMilestone(e.target.value)}
                placeholder="None"
                className="field-input"
              />
            </Field>

            <Field label="Start date">
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="field-input"
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="field-input"
              />
            </Field>
          </div>

          {/* Branch */}
          {task.branch && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#8b9cb6]">Branch</span>
              <div className="flex items-center gap-2 rounded-md border border-[#1e2d3d] bg-[#0a0f1a] px-2 py-1.5">
                <code className="flex-1 text-sm font-mono text-[#e2e8f0] truncate">
                  {task.branch}
                </code>
                <button
                  onClick={handleCopyBranch}
                  className="text-[#8b9cb6] hover:text-[#e2e8f0] shrink-0"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-[#8b9cb6]">Description</span>
              <MarkdownBody markdown={task.description} />
            </div>
          )}

          {/* Acceptance Criteria */}
          {acProgress && task.ai?.acceptance_criteria && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#8b9cb6]">
                  Acceptance Criteria
                </span>
                <span className="text-xs text-[#8b9cb6]">
                  {acProgress.done}/{acProgress.total} — {acProgress.percent}%
                </span>
              </div>
              <ProgressBar percent={acProgress.percent} />
              <ul className="space-y-1">
                {task.ai.acceptance_criteria.map((item, i) => {
                  const checked = item.startsWith("[x]") || item.startsWith("[X]");
                  const text = item.replace(/^\[.\]\s*/, "");
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mt-0.5 accent-blue-500"
                      />
                      <span className={cn("text-[#c9d1d9]", checked && "line-through opacity-60")}>
                        {text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {(task.depends_on.length > 0 || task.blocks.length > 0) && (
            <div className="space-y-2">
              {task.depends_on.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[#8b9cb6]">Depends on</span>
                  <div className="flex flex-wrap gap-1">
                    {task.depends_on.map((id) => (
                      <button
                        key={id}
                        onClick={() => onNavigateTask(id)}
                        className="rounded bg-[#1e2d3d] px-2 py-0.5 text-xs font-mono text-blue-400 hover:bg-[#253547]"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {task.blocks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-[#8b9cb6]">Blocks</span>
                  <div className="flex flex-wrap gap-1">
                    {task.blocks.map((id) => (
                      <button
                        key={id}
                        onClick={() => onNavigateTask(id)}
                        className="rounded bg-[#1e2d3d] px-2 py-0.5 text-xs font-mono text-blue-400 hover:bg-[#253547]"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Context */}
          {task.ai && (
            <div className="space-y-2">
              <button
                onClick={() => setAiOpen(!aiOpen)}
                className="flex items-center gap-1 text-xs font-medium text-[#8b9cb6] hover:text-[#e2e8f0]"
              >
                {aiOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                AI Context
              </button>
              {aiOpen && (
                <div className="space-y-3 pl-4 border-l border-[#1e2d3d]">
                  {task.ai.summary && (
                    <div className="space-y-1">
                      <span className="text-xs text-[#8b9cb6]">Summary</span>
                      <p className="text-sm text-[#c9d1d9]">{task.ai.summary}</p>
                    </div>
                  )}
                  {task.ai.implementation_context && task.ai.implementation_context.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-[#8b9cb6]">Implementation Context</span>
                      <ul className="space-y-0.5">
                        {task.ai.implementation_context.map((ctx, i) => (
                          <li key={i} className="text-xs font-mono text-[#c9d1d9]">{ctx}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.ai.test_strategy && task.ai.test_strategy.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-[#8b9cb6]">Test Strategy</span>
                      <ul className="space-y-0.5">
                        {task.ai.test_strategy.map((s, i) => (
                          <li key={i} className="text-sm text-[#c9d1d9]">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {task.ai.constraints && task.ai.constraints.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-[#8b9cb6]">Constraints</span>
                      <ul className="space-y-0.5">
                        {task.ai.constraints.map((c, i) => (
                          <li key={i} className="text-sm text-[#c9d1d9]">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Refs */}
          {task.refs.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#8b9cb6]">Refs</span>
              <ul className="space-y-1">
                {task.refs.map((ref, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setDocPreviewPath(ref.path)}
                      className="text-left text-xs font-mono text-blue-400 hover:underline"
                    >
                      {ref.path}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky action buttons */}
        <div className="flex items-center gap-2 border-t border-[#1e2d3d] px-5 py-3">
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-500/30 bg-transparent px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
          >
            Delete
          </button>
          <div className="flex-1" />
          {task.status !== "done" && task.status !== "cancelled" && (
            <button
              onClick={handleMarkDone}
              className="rounded-md border border-[#1e2d3d] bg-[#1a2332] px-3 py-1.5 text-sm text-[#e2e8f0] hover:bg-[#253547]"
            >
              Mark as Done
            </button>
          )}
          <button
            onClick={handleUpdate}
            disabled={!isDirty}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm text-white",
              isDirty
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-blue-500/40 cursor-not-allowed opacity-50",
            )}
          >
            Update
          </button>
        </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
