import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

interface MarkdownBodyProps {
  markdown: string;
  className?: string;
}

export function MarkdownBody({ markdown, className }: MarkdownBodyProps) {
  return (
    <div
      className={cn(
        "text-sm leading-relaxed text-[#c9d1d9] [&_a]:text-blue-400 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#334155] [&_blockquote]:pl-3 [&_blockquote]:text-[#94a3b8] [&_code]:rounded [&_code]:bg-[#0a0f1a] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-[#e2e8f0] [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#e2e8f0] [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-[15px] [&_h3]:font-medium [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[#1e2d3d] [&_pre]:bg-[#0a0f1a] [&_pre]:p-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#1e2d3d] [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-[#1e2d3d] [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
