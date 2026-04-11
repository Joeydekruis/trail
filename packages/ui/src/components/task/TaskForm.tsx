import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCreateTask } from "@/api/hooks";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  ESTIMATE_LABELS,
} from "@/lib/constants";
import type {
  TaskEstimate,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types/task";

const fieldInputClass =
  "field-input w-full rounded-md border border-[#1e2d3d] bg-[#0a0f1a] px-2 py-1.5 text-sm text-[#e2e8f0] focus:border-blue-500 focus:outline-none";

const fieldSelectClass =
  "field-select w-full rounded-md border border-[#1e2d3d] bg-[#0a0f1a] px-2 py-1.5 text-sm text-[#e2e8f0] focus:border-blue-500 focus:outline-none";

const CREATE_STATUSES: TaskStatus[] = ["draft", "todo"];

type EstimateChoice = "none" | TaskEstimate;

export interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskForm({ open, onOpenChange }: TaskFormProps) {
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("feature");
  const [priority, setPriority] = useState<TaskPriority>("p2");
  const [status, setStatus] = useState<TaskStatus>("draft");
  const [estimate, setEstimate] = useState<EstimateChoice>("none");
  const [assignee, setAssignee] = useState("");
  const [milestone, setMilestone] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setType("feature");
    setPriority("p2");
    setStatus("draft");
    setEstimate("none");
    setAssignee("");
    setMilestone("");
  }

  function buildPayload(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      title: title.trim(),
      type,
      priority,
      status,
    };
    const desc = description.trim();
    if (desc) data.description = desc;
    if (estimate !== "none") data.estimate = estimate;
    const a = assignee.trim();
    if (a) data.assignee = a;
    const m = milestone.trim();
    if (m) data.milestone = m;
    return data;
  }

  function submit() {
    if (!title.trim()) return;
    const data = buildPayload();
    createTask.mutate(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#1e2d3d] bg-[#111827] p-6 shadow-lg"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        >
          <Dialog.Description className="sr-only">
            Create a new task by filling in the form below.
          </Dialog.Description>

          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-[#e2e8f0]">
              New Task
            </Dialog.Title>
            <Dialog.Close
              type="button"
              className="text-[#8b9cb6] hover:text-[#e2e8f0]"
              aria-label="Close"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div>
              <label
                htmlFor="task-title"
                className="mb-1 block text-xs font-medium text-[#8b9cb6]"
              >
                Title
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={fieldInputClass}
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="task-description"
                className="mb-1 block text-xs font-medium text-[#8b9cb6]"
              >
                Description
              </label>
              <textarea
                id="task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Markdown supported…"
                className={fieldInputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="task-type"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Type
                </label>
                <select
                  id="task-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className={fieldSelectClass}
                >
                  {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="task-priority"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={fieldSelectClass}
                >
                  {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="task-status"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Status
                </label>
                <select
                  id="task-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={fieldSelectClass}
                >
                  {CREATE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="task-estimate"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Estimate
                </label>
                <select
                  id="task-estimate"
                  value={estimate}
                  onChange={(e) =>
                    setEstimate(e.target.value as EstimateChoice)
                  }
                  className={fieldSelectClass}
                >
                  <option value="none">None</option>
                  {(Object.keys(ESTIMATE_LABELS) as TaskEstimate[]).map(
                    (est) => (
                      <option key={est} value={est}>
                        {ESTIMATE_LABELS[est]}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="task-assignee"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Assignee
                </label>
                <input
                  id="task-assignee"
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="task-milestone"
                  className="mb-1 block text-xs font-medium text-[#8b9cb6]"
                >
                  Milestone
                </label>
                <input
                  id="task-milestone"
                  type="text"
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value)}
                  className={fieldInputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close
                type="button"
                className="rounded-md border border-[#1e2d3d] bg-transparent px-4 py-2 text-sm text-[#e2e8f0] hover:bg-[#1a2332]"
              >
                Cancel
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || createTask.isPending}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600 disabled:pointer-events-none disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
