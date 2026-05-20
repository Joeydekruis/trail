export type DocFrontmatter = {
  title?: string;
  icon?: string;
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseYamlLine(line: string): { key: string; value: string } | null {
  const m = line.match(/^([a-z_]+):\s*(.*)$/i);
  if (!m) return null;
  let value = m[2]!.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return { key: m[1]!.toLowerCase(), value };
}

export function parseFrontmatter(raw: string): {
  meta: DocFrontmatter;
  body: string;
} {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { meta: {}, body: raw };
  }
  const meta: DocFrontmatter = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const parsed = parseYamlLine(line.trim());
    if (!parsed) continue;
    if (parsed.key === "title") meta.title = parsed.value;
    if (parsed.key === "icon") meta.icon = parsed.value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

export function composeDocument(meta: DocFrontmatter, body: string): string {
  const lines: string[] = ["---"];
  if (meta.title) {
    lines.push(`title: ${meta.title}`);
  }
  if (meta.icon) {
    lines.push(`icon: "${meta.icon.replace(/"/g, '\\"')}"`);
  }
  lines.push("---", "");
  const trimmedBody = body.replace(/^\n+/, "");
  return `${lines.join("\n")}${trimmedBody}`;
}
