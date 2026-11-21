/** Minimal Markdown preview (headings + paragraphs) without a parser dependency. */
export function splitMarkdownBlocks(markdown: string): Array<{ kind: "h1" | "h2" | "p"; text: string }> {
  const blocks: Array<{ kind: "h1" | "h2" | "p"; text: string }> = [];
  for (const raw of markdown.split(/\n\n+/)) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push({ kind: "h1", text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      continue;
    }
    blocks.push({ kind: "p", text: line.replace(/\n/g, " ") });
  }
  return blocks;
}

export function MarkdownPreview({ markdown }: { markdown: string }) {
  const blocks = splitMarkdownBlocks(markdown);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {blocks.map((block, index) => {
        if (block.kind === "h1") {
          return (
            <h1
              key={`${index}-h1`}
              style={{ margin: 0, fontSize: 22, lineHeight: "28px", fontWeight: 600 }}
            >
              {block.text}
            </h1>
          );
        }
        if (block.kind === "h2") {
          return (
            <h2 key={`${index}-h2`} style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>
              {block.text}
            </h2>
          );
        }
        return (
          <p key={`${index}-p`} style={{ margin: 0, color: "var(--ink-soft)" }}>
            {block.text}
          </p>
        );
      })}
    </div>
  );
}