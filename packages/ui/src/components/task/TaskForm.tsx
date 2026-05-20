import { useState } from "react";
import { useCreateTask } from "@/api/hooks";
import { FormField } from "@/components/shared/FormField";
import { OptionalSelect } from "@/components/shared/OptionalSelect";
import { useToast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssigneeSelect } from "@/components/task/AssigneeSelect";
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TYPE_LABELS,
  ESTIMATE_LABELS,
  ESTIMATE_ORDER,
} from "@/lib/constants";
import type {
  TaskEstimate,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types/task";

const CREATE_STATUSES: TaskStatus[] = ["draft", "todo"];

type EstimateChoice = "none" | TaskEstimate;

export interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (taskId: string) => void;
}

export function TaskForm({ open, onOpenChange, onCreated }: TaskFormProps) {
  const createTask = useCreateTask();
  const { toast } = useToast();

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
      onSuccess: (res) => {
        if (res.warning) {
          toast("warning", res.warning);
        } else if (res.task.github) {
          toast("success", `Created GitHub issue #${res.task.github.issue_number}`);
        } else if (res.task.status === "draft") {
          toast("success", "Draft saved locally");
        }
        reset();
        onOpenChange(false);
        onCreated?.(res.task.id);
      },
      onError: () => {
        toast("error", "Could not create task");
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-w-lg"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new task by filling in the form below.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FormField label="Title" htmlFor="task-title">
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </FormField>

          <FormField label="Description" htmlFor="task-description">
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Markdown supported…"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Type" htmlFor="task-type">
              <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
                <SelectTrigger id="task-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABELS) as TaskType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Priority" htmlFor="task-priority">
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger id="task-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_ORDER.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Status" htmlFor="task-status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
              >
                <SelectTrigger id="task-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREATE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Estimate" htmlFor="task-estimate">
              <OptionalSelect
                value={estimate === "none" ? "" : estimate}
                onValueChange={(v) =>
                  setEstimate((v || "none") as EstimateChoice)
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Assignee" htmlFor="task-assignee">
              <AssigneeSelect
                value={assignee}
                onValueChange={setAssignee}
                extraOptions={assignee.trim() ? [assignee.trim()] : []}
              />
            </FormField>

            <FormField label="Milestone" htmlFor="task-milestone">
              <Input
                id="task-milestone"
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
              />
            </FormField>
          </div>

          <DialogFooter className="gap-3 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
