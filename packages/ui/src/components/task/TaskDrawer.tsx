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
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TypeBadge, PriorityBadge, StatusBadge } from "@/components/shared/Badge";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FormField } from "@/components/shared/FormField";
import { OptionalSelect } from "@/components/shared/OptionalSelect";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { TaskDescription } from "@/components/task/TaskDescription";
import { TaskComments } from "@/components/task/TaskComments";
import { useUpdateTask, useDeleteTask, useDocs } from "@/api/hooks";
import {
  docRefForPath,
  docRefMatches,
  normalizeDocRefPath,
} from "@/lib/doc-ref";
import { useToast } from "@/components/shared/Toast";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AssigneeSelect } from "@/components/task/AssigneeSelect";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TYPE_LABELS,
  ESTIMATE_LABELS,
  ESTIMATE_ORDER,
} from "@/lib/constants";
import { acceptanceCriteriaProgress } from "@/lib/utils";
import type {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  TaskEstimate,
} from "@/types/task";

const DRAWER_WIDTH_CLASS = "w-[min(800px,calc(100vw-2rem))]";

interface TaskDrawerProps {
  task: Task;
  onClose: () => void;
  onNavigateTask: (taskId: string) => void;
}

function DocPeekPanel({ path, onClose }: { path: string; onClose: () => void }) {
  const trailPath = normalizeDocRefPath(path);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["doc-peek", path, trailPath],
    queryFn: async () => {
      try {
        const res = await api.getDoc(trailPath);
        return { content: res.doc.content, source: "trail" as const };
      } catch {
        const res = await api.getRepoFile(path);
        return { content: res.content, source: "repo" as const };
      }
    },
  });

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl",
        "w-[min(380px,calc(100vw-3rem))]",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span
            className="truncate font-mono text-xs text-muted-foreground"
            title={path}
          >
            {path}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close documentation panel"
        >
          <X size={18} />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
        {isError && (
          <p className="text-sm text-red-400/90">
            Could not read this path from the repository.
          </p>
        )}
        {data?.content !== undefined && (
          <MarkdownBody markdown={data.content} />
        )}
        {data?.source === "trail" && (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            .trail/docs/{trailPath}
          </p>
        )}
      </div>
    </aside>
  );
}

export function TaskDrawer({ task, onClose, onNavigateTask }: TaskDrawerProps) {
  const [docPreviewPath, setDocPreviewPath] = useState<string | null>(null);
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editStatus, setEditStatus] = useState<TaskStatus>(task.status);
  const [editPriority, setEditPriority] = useState<TaskPriority | "">(
    task.priority ?? "",
  );
  const [editType, setEditType] = useState<TaskType>(task.type);
  const [editAssignee, setEditAssignee] = useState(task.assignee ?? "");
  const [editEstimate, setEditEstimate] = useState<TaskEstimate | "">(
    task.estimate ?? "",
  );
  const [editMilestone, setEditMilestone] = useState(task.milestone ?? "");
  const [editStartDate, setEditStartDate] = useState(task.start_date ?? "");
  const [editDueDate, setEditDueDate] = useState(task.due_date ?? "");

  const [copied, setCopied] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: docsPayload } = useDocs(30_000);
  const docs = docsPayload?.docs ?? [];
  const { toast } = useToast();

  const docRefs = task.refs.filter((r) => r.type === "doc");
  const linkableDocs = docs.filter(
    (d) => !docRefs.some((ref) => docRefMatches(d.path, ref.path)),
  );

  function linkDoc(docPath: string) {
    updateTask.mutate(
      {
        id: task.id,
        data: { refs: [...task.refs, docRefForPath(docPath)] },
      },
      {
        onSuccess: (res) => {
          if (res.warning) toast("warning", res.warning);
          else toast("success", "Document linked");
        },
        onError: () => toast("error", "Could not link document"),
      },
    );
  }

  function unlinkDoc(refPath: string) {
    updateTask.mutate(
      {
        id: task.id,
        data: {
          refs: task.refs.filter(
            (ref) => !(ref.type === "doc" && ref.path === refPath),
          ),
        },
      },
      {
        onSuccess: (res) => {
          if (res.warning) toast("warning", res.warning);
        },
        onError: () => toast("error", "Could not unlink document"),
      },
    );
  }

  useEffect(() => {
    setDocPreviewPath(null);
    setDescriptionEditing(false);
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
    updateTask.mutate(
      { id: task.id, data },
      {
        onSuccess: (res) => {
          if (res.warning) {
            toast("warning", res.warning);
          } else if (task.github) {
            toast("success", "Updated on GitHub");
          }
        },
        onError: () => {
          toast("error", "Could not update task");
        },
      },
    );
  }

  function handleMarkDone() {
    updateTask.mutate(
      { id: task.id, data: { status: "done" } },
      {
        onSuccess: (res) => {
          if (res.warning) {
            toast("warning", res.warning);
          } else if (task.github) {
            toast("success", "Marked done on GitHub");
          }
        },
        onError: () => {
          toast("error", "Could not update task");
        },
      },
    );
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
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className={cn(
            "flex flex-row gap-3 border-0 bg-transparent p-0 shadow-none",
            "inset-y-4 right-4 left-auto h-[calc(100vh-2rem)] max-w-none sm:max-w-none",
          )}
        >
          {docPreviewPath ? (
            <DocPeekPanel
              path={docPreviewPath}
              onClose={() => setDocPreviewPath(null)}
            />
          ) : null}

          <div
            className={cn(
              "flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl",
              DRAWER_WIDTH_CLASS,
            )}
          >
            <header className="shrink-0 border-b border-border px-6 py-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TypeBadge type={task.type} />
                  {task.priority ? (
                    <PriorityBadge priority={task.priority} />
                  ) : null}
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setDescriptionEditing(true)}
                  >
                    <Pencil size={14} />
                    Edit
                  </Button>
                  {task.github?.url ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      asChild
                    >
                      <a
                        href={task.github.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open on GitHub"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={onClose}
                    aria-label="Close task"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>

              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
              />

              {task.assignee ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs text-blue-500 dark:text-blue-400">
                    {task.assignee[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {task.assignee}
                  </span>
                </div>
              ) : null}
            </header>

            <div className="flex min-h-0 flex-1">
              <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
                <TaskDescription
                  taskId={task.id}
                  description={task.description}
                  editing={descriptionEditing}
                  onEditingChange={setDescriptionEditing}
                />

                <TaskComments task={task} />

                {acProgress && task.ai?.acceptance_criteria ? (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Acceptance Criteria
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {acProgress.done}/{acProgress.total} —{" "}
                        {acProgress.percent}%
                      </span>
                    </div>
                    <ProgressBar percent={acProgress.percent} />
                    <ul className="space-y-1">
                      {task.ai.acceptance_criteria.map((item, i) => {
                        const checked =
                          item.startsWith("[x]") || item.startsWith("[X]");
                        const text = item.replace(/^\[.\]\s*/, "");
                        return (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              disabled
                              className="mt-0.5"
                            />
                            <span
                              className={cn(
                                "text-foreground/90",
                                checked && "line-through opacity-60",
                              )}
                            >
                              {text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}

                {(task.depends_on.length > 0 || task.blocks.length > 0) && (
                  <div className="mt-6 space-y-2">
                    {task.depends_on.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Depends on
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {task.depends_on.map((id) => (
                            <Button
                              key={id}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-auto px-2 py-0.5 font-mono text-xs text-blue-500 dark:text-blue-400"
                              onClick={() => onNavigateTask(id)}
                            >
                              {id}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.blocks.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Blocks
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {task.blocks.map((id) => (
                            <Button
                              key={id}
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="h-auto px-2 py-0.5 font-mono text-xs text-blue-500 dark:text-blue-400"
                              onClick={() => onNavigateTask(id)}
                            >
                              {id}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {task.ai ? (
                  <Collapsible
                    open={aiOpen}
                    onOpenChange={setAiOpen}
                    className="mt-6"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto gap-1 px-0 text-xs font-medium text-muted-foreground"
                      >
                        {aiOpen ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                        AI Context
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 border-l border-border pl-4">
                      {task.ai.summary && (
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            Summary
                          </span>
                          <p className="text-sm text-foreground/90">
                            {task.ai.summary}
                          </p>
                        </div>
                      )}
                      {task.ai.implementation_context &&
                        task.ai.implementation_context.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Implementation Context
                            </span>
                            <ul className="space-y-0.5">
                              {task.ai.implementation_context.map((ctx, i) => (
                                <li
                                  key={i}
                                  className="font-mono text-xs text-foreground/90"
                                >
                                  {ctx}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {task.ai.test_strategy &&
                        task.ai.test_strategy.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Test Strategy
                            </span>
                            <ul className="space-y-0.5">
                              {task.ai.test_strategy.map((s, i) => (
                                <li key={i} className="text-sm text-foreground/90">
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {task.ai.constraints && task.ai.constraints.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs text-muted-foreground">
                            Constraints
                          </span>
                          <ul className="space-y-0.5">
                            {task.ai.constraints.map((c, i) => (
                              <li key={i} className="text-sm text-foreground/90">
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ) : null}

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Documents
                    </span>
                    {linkableDocs.length > 0 && (
                      <Select onValueChange={linkDoc}>
                        <SelectTrigger className="h-7 w-[140px] text-xs">
                          <SelectValue placeholder="Link doc…" />
                        </SelectTrigger>
                        <SelectContent>
                          {linkableDocs.map((d) => (
                            <SelectItem key={d.path} value={d.path}>
                              {d.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {docRefs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No documents linked.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {docRefs.map((ref, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2"
                        >
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto min-w-0 flex-1 justify-start p-0 font-mono text-xs text-blue-500 dark:text-blue-400"
                            onClick={() => setDocPreviewPath(ref.path)}
                          >
                            {normalizeDocRefPath(ref.path)}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Unlink document"
                            onClick={() => unlinkDoc(ref.path)}
                          >
                            <X size={14} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {task.refs.filter((r) => r.type !== "doc").length > 0 && (
                    <div className="space-y-1 pt-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Other refs
                      </span>
                      <ul className="space-y-1">
                        {task.refs
                          .filter((r) => r.type !== "doc")
                          .map((ref, i) => (
                            <li key={i}>
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 font-mono text-xs text-blue-500 dark:text-blue-400"
                                onClick={() => setDocPreviewPath(ref.path)}
                              >
                                {ref.type}: {ref.path}
                              </Button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </main>

              <aside className="w-56 shrink-0 overflow-y-auto border-l border-border bg-muted/15 px-4 py-4">
                <div className="space-y-3">
                  <FormField label="Status">
                    <Select
                      value={editStatus}
                      onValueChange={(v) => setEditStatus(v as TaskStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Priority">
                    <OptionalSelect
                      value={editPriority}
                      onValueChange={(v) =>
                        setEditPriority(v as TaskPriority | "")
                      }
                      placeholder="None"
                    >
                      {PRIORITY_ORDER.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </OptionalSelect>
                  </FormField>

                  <FormField label="Type">
                    <Select
                      value={editType}
                      onValueChange={(v) => setEditType(v as TaskType)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Assignee">
                    <AssigneeSelect
                      value={editAssignee}
                      onValueChange={setEditAssignee}
                      extraOptions={
                        task.assignee ? [task.assignee] : []
                      }
                    />
                  </FormField>

                  <FormField label="Estimate">
                    <OptionalSelect
                      value={editEstimate}
                      onValueChange={(v) =>
                        setEditEstimate(v as TaskEstimate | "")
                      }
                      placeholder="None"
                    >
                      {ESTIMATE_ORDER.map((est) => (
                        <SelectItem key={est} value={est}>
                          {ESTIMATE_LABELS[est]}
                        </SelectItem>
                      ))}
                    </OptionalSelect>
                  </FormField>

                  <FormField label="Milestone">
                    <Input
                      value={editMilestone}
                      onChange={(e) => setEditMilestone(e.target.value)}
                      placeholder="None"
                    />
                  </FormField>

                  <FormField label="Start date">
                    <DatePicker
                      value={editStartDate}
                      onChange={setEditStartDate}
                      placeholder="No start date"
                    />
                  </FormField>

                  <FormField label="Due date">
                    <DatePicker
                      value={editDueDate}
                      onChange={setEditDueDate}
                      placeholder="No due date"
                    />
                  </FormField>

                  {task.branch ? (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Branch
                      </span>
                      <div className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5">
                        <code className="flex-1 truncate font-mono text-xs text-foreground">
                          {task.branch}
                        </code>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={handleCopyBranch}
                          className="shrink-0"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {task.labels.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Labels
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {task.labels.map((label) => (
                          <span
                            key={label}
                            className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-foreground/80"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>

            <footer className="flex shrink-0 items-center gap-2 border-t border-border px-6 py-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
              <div className="flex-1" />
              {task.status !== "done" && task.status !== "cancelled" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMarkDone}
                >
                  Mark as Done
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleUpdate}
                disabled={!isDirty || descriptionEditing}
              >
                Update
              </Button>
            </footer>
          </div>
        </SheetContent>
      </Sheet>

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
