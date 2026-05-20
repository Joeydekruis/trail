import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Trash2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useDoc,
  useUpdateDoc,
  useDeleteDoc,
  useTasks,
  useUpdateTask,
} from "@/api/hooks";
import { RichTextEditor } from "@/components/docs/RichTextEditor";
import { DocEmojiPicker } from "@/components/docs/DocEmojiPicker";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/components/shared/Toast";
import { docRefForPath, docRefMatches } from "@/lib/doc-ref";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SAVE_DEBOUNCE_MS = 600;

interface DocumentsPageProps {
  selectedPath: string | null;
  onSelectTask: (taskId: string) => void;
  onDeleted?: () => void;
}

export function DocumentsPage({
  selectedPath,
  onSelectTask,
  onDeleted,
}: DocumentsPageProps) {
  const { data: doc, isLoading: docLoading } = useDoc(selectedPath);
  const { data: tasks = [] } = useTasks(30_000);
  const updateDoc = useUpdateDoc();
  const deleteDoc = useDeleteDoc();
  const updateTask = useUpdateTask();
  const { toast } = useToast();

  const [draftContent, setDraftContent] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftIcon, setDraftIcon] = useState("📄");
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({ content: "", title: "", icon: "📄" });

  useEffect(() => {
    if (!doc) {
      setDraftContent("");
      setDraftTitle("");
      setDraftIcon("📄");
      setDirty(false);
      lastSaved.current = { content: "", title: "", icon: "📄" };
      return;
    }
    setDraftContent(doc.content);
    setDraftTitle(doc.title);
    setDraftIcon(doc.icon);
    setDirty(false);
    lastSaved.current = {
      content: doc.content,
      title: doc.title,
      icon: doc.icon,
    };
  }, [doc?.path, doc?.content, doc?.title, doc?.icon]);

  const linkedTasks = useMemo(() => {
    if (!selectedPath) return [];
    return tasks.filter((t) =>
      t.refs.some(
        (ref) => ref.type === "doc" && docRefMatches(selectedPath, ref.path),
      ),
    );
  }, [tasks, selectedPath]);

  const saveNow = useCallback(
    (updates: { content?: string; title?: string; icon?: string }) => {
      if (!selectedPath) return;
      const next = {
        content: updates.content ?? draftContent,
        title: updates.title ?? draftTitle,
        icon: updates.icon ?? draftIcon,
      };
      if (
        next.content === lastSaved.current.content &&
        next.title === lastSaved.current.title &&
        next.icon === lastSaved.current.icon
      ) {
        return;
      }
      updateDoc.mutate(
        { path: selectedPath, data: next },
        {
          onSuccess: () => {
            lastSaved.current = next;
            setDirty(false);
          },
          onError: () => toast("error", "Could not save document"),
        },
      );
    },
    [selectedPath, draftContent, draftTitle, draftIcon, updateDoc, toast],
  );

  const scheduleSave = useCallback(
    (updates: { content?: string; title?: string; icon?: string }) => {
      if (updates.content !== undefined) setDraftContent(updates.content);
      if (updates.title !== undefined) setDraftTitle(updates.title);
      if (updates.icon !== undefined) setDraftIcon(updates.icon);
      const next = {
        content: updates.content ?? draftContent,
        title: updates.title ?? draftTitle,
        icon: updates.icon ?? draftIcon,
      };
      const isDirty =
        next.content !== lastSaved.current.content ||
        next.title !== lastSaved.current.title ||
        next.icon !== lastSaved.current.icon;
      setDirty(isDirty);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveNow(next), SAVE_DEBOUNCE_MS);
    },
    [draftContent, draftTitle, draftIcon, saveNow],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function handleDelete() {
    if (!selectedPath) return;
    deleteDoc.mutate(selectedPath, {
      onSuccess: () => {
        setConfirmDelete(false);
        onDeleted?.();
        toast("success", "Document deleted");
      },
      onError: () => toast("error", "Could not delete document"),
    });
  }

  function linkTask(taskId: string) {
    if (!selectedPath) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const has = task.refs.some(
      (ref) => ref.type === "doc" && docRefMatches(selectedPath, ref.path),
    );
    if (has) return;
    updateTask.mutate({
      id: taskId,
      data: { refs: [...task.refs, docRefForPath(selectedPath)] },
    });
  }

  function unlinkTask(taskId: string) {
    if (!selectedPath) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask.mutate({
      id: taskId,
      data: {
        refs: task.refs.filter(
          (ref) => !(ref.type === "doc" && ref.path === selectedPath),
        ),
      },
    });
  }

  const unlinkableTaskOptions = tasks.filter(
    (t) =>
      !t.refs.some(
        (ref) =>
          ref.type === "doc" &&
          selectedPath &&
          docRefMatches(selectedPath, ref.path),
      ),
  );

  if (!selectedPath) {
    return (
      <EmptyState
        icon={<FileText className="h-10 w-10 text-muted-foreground" />}
        title="Select a page"
        description="Choose a page from the sidebar, or create a new one with +."
      />
    );
  }

  if (docLoading && !doc) {
    return <p className="text-sm text-muted-foreground">Loading page…</p>;
  }

  if (!doc) {
    return <p className="text-sm text-red-400/90">Page not found.</p>;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[400px] flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <DocEmojiPicker
          value={draftIcon}
          onChange={(icon) => scheduleSave({ icon })}
        />
        <div className="min-w-0 flex-1">
          <Input
            value={draftTitle}
            onChange={(e) => scheduleSave({ title: e.target.value })}
            className="h-9 border-none bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            placeholder="Untitled"
          />
          <p className="font-mono text-xs text-muted-foreground">
            .trail/docs/{doc.path}
            {dirty || updateDoc.isPending ? " · Saving…" : null}
            {!dirty && !updateDoc.isPending
              ? ` · ${formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}`
              : null}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={14} className="mr-1" />
          Delete
        </Button>
      </div>

      <RichTextEditor
        key={doc.path}
        markdown={draftContent}
        onChange={(content) => scheduleSave({ content })}
        className="min-h-0 flex-1"
      />

      <section className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium">Linked tasks</span>
          {unlinkableTaskOptions.length > 0 && (
            <Select onValueChange={linkTask}>
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Link a task…" />
              </SelectTrigger>
              <SelectContent>
                {unlinkableTaskOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    #{t.id} {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {linkedTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks linked.</p>
        ) : (
          <ul className="space-y-1">
            {linkedTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/50"
              >
                <button
                  type="button"
                  className="truncate text-left text-sm text-blue-500 hover:underline dark:text-blue-400"
                  onClick={() => onSelectTask(t.id)}
                >
                  #{t.id} {t.title}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Unlink task ${t.id}`}
                  onClick={() => unlinkTask(t.id)}
                >
                  <X size={14} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete page?"
        description={`Delete "${doc.title}"? Linked task references will be removed.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
