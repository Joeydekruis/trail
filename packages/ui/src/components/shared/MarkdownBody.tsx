import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

interface MarkdownBodyProps {
  markdown: string;
  className?: string;
}

/** GitHub-flavored markdown (GFM): headings, emphasis, code, quotes, lists, task lists, tables, strikethrough, links. */
export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  return (
    <div
      className={cn(
        "markdown-body text-sm leading-relaxed text-foreground/90",
        "[&_a]:text-blue-500 [&_a]:underline dark:[&_a]:text-blue-400",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px]",
        "[&_del]:text-muted-foreground",
        "[&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground",
        "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-1.5 [&_h2]:text-lg [&_h2]:font-semibold",
        "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold",
        "[&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold",
        "[&_hr]:my-4 [&_hr]:border-border",
        "[&_img]:max-w-full [&_img]:rounded-md",
        "[&_li]:my-0.5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_p]:my-2 [&_p]:leading-relaxed",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-3",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse",
        "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5",
        "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:pl-1",
        "[&_li.task-list-item]:flex [&_li.task-list-item]:list-none [&_li.task-list-item]:items-start [&_li.task-list-item]:gap-2",
        "[&_li.task-list-item>input]:mt-1 [&_li.task-list-item>input]:size-4 [&_li.task-list-item>input]:shrink-0 [&_li.task-list-item>input]:accent-primary",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
