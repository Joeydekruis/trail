import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { MarkdownBody } from "@/components/shared/MarkdownBody";
import { useCreateTaskComment, useTaskComments } from "@/api/hooks";
import { useToast } from "@/components/shared/Toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@/types/task";

interface TaskCommentsProps {
  task: Task;
}

export function TaskComments({ task }: TaskCommentsProps) {
  const linked = task.github?.issue_number !== undefined;
  const { data: comments = [], isLoading, isError, error } = useTaskComments(
    task.id,
    linked,
  );
  const createComment = useCreateTaskComment(task.id);
  const { toast } = useToast();
  const [draft, setDraft] = useState("");

  function submit() {
    const body = draft.trim();
    if (!body) return;
    createComment.mutate(body, {
      onSuccess: () => {
        setDraft("");
        toast("success", "Comment posted");
      },
      onError: () => {
        toast("error", "Could not post comment");
      },
    });
  }

  return (
    <div className="space-y-4 border-t border-border pt-6">
      <h3 className="text-sm font-semibold text-foreground">
        Comments
        {comments.length > 0 ? (
          <span className="ml-1.5 font-normal text-muted-foreground">
            ({comments.length})
          </span>
        ) : null}
      </h3>

      {!linked ? (
        <p className="text-sm text-muted-foreground">
          Link this task to a GitHub issue to view and add comments.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : isError ? (
        <p className="text-sm text-red-400/90">
          {error instanceof Error ? error.message : "Could not load comments"}
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-border bg-muted/20 px-4 py-3"
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {comment.author}
                </span>
                <span>commented</span>
                <time dateTime={comment.created_at} title={comment.created_at}>
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                  })}
                </time>
                <a
                  href={comment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-blue-500 hover:underline dark:text-blue-400"
                  aria-label="Open comment on GitHub"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
              <MarkdownBody markdown={comment.body} />
            </li>
          ))}
        </ul>
      )}

      {linked ? (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
          <label
            htmlFor={`comment-${task.id}`}
            className="text-sm font-medium text-foreground"
          >
            Add a comment
          </label>
          <Textarea
            id={`comment-${task.id}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            placeholder="Use Markdown to format your comment"
            className="text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={!draft.trim() || createComment.isPending}
            >
              Comment
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
