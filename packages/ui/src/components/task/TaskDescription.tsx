import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { useUpdateTask } from "@/api/hooks";
import { useToast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TaskDescriptionProps {
  taskId: string;
  description?: string;
  onEditRequest?: () => void;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function TaskDescription({
  taskId,
  description = "",
  onEditRequest,
  editing: controlledEditing,
  onEditingChange,
}: TaskDescriptionProps) {
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = controlledEditing ?? internalEditing;
  const setEditing = onEditingChange ?? setInternalEditing;

  const [draft, setDraft] = useState(description);
  const updateTask = useUpdateTask();
  const { toast } = useToast();

  useEffect(() => {
    if (!editing) {
      setDraft(description);
    }
  }, [description, editing]);

  function startEditing() {
    setDraft(description);
    setEditing(true);
    onEditRequest?.();
  }

  function cancel() {
    setDraft(description);
    setEditing(false);
  }

  function save() {
    const trimmed = draft.trim();
    updateTask.mutate(
      { id: taskId, data: { description: trimmed } },
      {
        onSuccess: (res) => {
          setEditing(false);
          if (res.warning) {
            toast("warning", res.warning);
          } else {
            toast("success", "Description saved");
          }
        },
        onError: () => {
          toast("error", "Could not save description");
        },
      },
    );
  }

  const isDirty = draft.trim() !== description.trim();

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Description</span>
          <span className="text-xs text-muted-foreground">Markdown supported</span>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          className="min-h-[200px] font-mono text-sm"
          placeholder="Write your description using Markdown…"
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={cancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={!isDirty || updateTask.isPending}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">Description</span>
      <button
        type="button"
        onClick={startEditing}
        className={cn(
          "group w-full rounded-lg border border-transparent text-left transition-colors",
          "hover:border-border hover:bg-muted/40",
          !description.trim() && "min-h-[120px] border-dashed border-border",
        )}
      >
        {description.trim() ? (
          <div className="px-3 py-3">
            <MarkdownBody markdown={description} />
          </div>
        ) : (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-4 py-8 text-muted-foreground">
            <Pencil className="size-4 opacity-60 group-hover:opacity-100" />
            <span className="text-sm">Click to add a description</span>
          </div>
        )}
      </button>
    </div>
  );
}
