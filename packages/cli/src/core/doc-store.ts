import fs from "node:fs";
import path from "node:path";

import {
  composeDocument,
  parseFrontmatter,
  type DocFrontmatter,
} from "./doc-frontmatter.js";

const DOC_EXTENSIONS = [".md", ".mdx"] as const;
const FOLDER_META_FILE = ".trail-meta.json";
const DEFAULT_DOC_ICON = "📄";
const DEFAULT_FOLDER_ICON = "📁";

export type TrailDocMeta = {
  path: string;
  title: string;
  icon: string;
  updated_at: string;
};

export type TrailDocFolderMeta = {
  path: string;
  name: string;
  icon: string;
};

export type DocTreeEntry =
  | {
      type: "folder";
      path: string;
      name: string;
      icon: string;
      children: DocTreeEntry[];
    }
  | {
      type: "doc";
      path: string;
      title: string;
      icon: string;
      updated_at: string;
    };

export function isDocExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return DOC_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isHiddenEntry(name: string): boolean {
  return name.startsWith(".") || name === FOLDER_META_FILE;
}

/**
 * Resolves a relative path under `docsDir`. Rejects `..`, absolute paths, and non-doc extensions.
 */
export function resolveDocPath(
  docsDir: string,
  rel: string,
): { absolute: string; relative: string } | null {
  const trimmed = rel.trim().replace(/^\/+/, "").replace(/\\/g, "/");
  if (trimmed === "" || trimmed.includes("\0")) {
    return null;
  }
  const normalized = path.posix.normalize(trimmed);
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.isAbsolute(normalized)
  ) {
    return null;
  }
  if (!isDocExtension(normalized)) {
    return null;
  }
  const absolute = path.resolve(docsDir, normalized);
  const docsResolved = path.resolve(docsDir);
  const relToDocs = path.relative(docsResolved, absolute);
  if (relToDocs.startsWith(`..${path.sep}`) || relToDocs === "..") {
    return null;
  }
  return { absolute, relative: relToDocs.split(path.sep).join("/") };
}

export function resolveFolderPath(
  docsDir: string,
  rel: string,
): { absolute: string; relative: string } | null {
  const trimmed = rel.trim().replace(/^\/+/, "").replace(/\\/g, "/");
  if (trimmed === "" || trimmed.includes("\0")) {
    return null;
  }
  const normalized = path.posix.normalize(trimmed);
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.isAbsolute(normalized)
  ) {
    return null;
  }
  const absolute = path.resolve(docsDir, normalized);
  const docsResolved = path.resolve(docsDir);
  const relToDocs = path.relative(docsResolved, absolute);
  if (relToDocs.startsWith(`..${path.sep}`) || relToDocs === "..") {
    return null;
  }
  return { absolute, relative: relToDocs.split(path.sep).join("/") };
}

function titleFromContent(meta: DocFrontmatter, body: string, fallback: string): string {
  if (meta.title) return meta.title;
  const match = body.match(/^#\s+(.+)$/m);
  if (match?.[1]) return match[1].trim();
  const base = path.basename(fallback, path.extname(fallback));
  return base.replace(/[-_]/g, " ");
}

function statMtimeIso(filePath: string): string {
  return fs.statSync(filePath).mtime.toISOString();
}

function readFolderMeta(folderAbs: string): TrailDocFolderMeta | null {
  const metaPath = path.join(folderAbs, FOLDER_META_FILE);
  if (!fs.existsSync(metaPath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(metaPath, "utf8")) as {
      name?: string;
      icon?: string;
    };
    const rel = path.basename(folderAbs);
    return {
      path: "",
      name: typeof raw.name === "string" ? raw.name : rel,
      icon: typeof raw.icon === "string" ? raw.icon : DEFAULT_FOLDER_ICON,
    };
  } catch {
    return null;
  }
}

function folderDisplayName(folderAbs: string, relPath: string): string {
  const meta = readFolderMeta(folderAbs);
  if (meta?.name) return meta.name;
  const segment = relPath.includes("/")
    ? relPath.split("/").pop()!
    : relPath;
  return segment.replace(/[-_]/g, " ");
}

function folderIcon(folderAbs: string): string {
  return readFolderMeta(folderAbs)?.icon ?? DEFAULT_FOLDER_ICON;
}

function parseDocFile(
  rel: string,
  content: string,
  mtime: string,
): TrailDocMeta {
  const { meta, body } = parseFrontmatter(content);
  return {
    path: rel,
    title: titleFromContent(meta, body, rel),
    icon: meta.icon ?? DEFAULT_DOC_ICON,
    updated_at: mtime,
  };
}

export function listDocs(docsDir: string): TrailDocMeta[] {
  if (!fs.existsSync(docsDir)) {
    return [];
  }
  const results: TrailDocMeta[] = [];

  function walk(dir: string, prefix: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (isHiddenEntry(entry.name)) continue;
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, rel.replace(/\\/g, "/"));
        continue;
      }
      if (!entry.isFile() || !isDocExtension(entry.name)) {
        continue;
      }
      const content = fs.readFileSync(full, "utf8");
      results.push(
        parseDocFile(rel.replace(/\\/g, "/"), content, statMtimeIso(full)),
      );
    }
  }

  walk(docsDir, "");
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

export function listDocTree(docsDir: string): DocTreeEntry[] {
  if (!fs.existsSync(docsDir)) {
    return [];
  }

  function walkDir(dir: string, prefix: string): DocTreeEntry[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const nodes: DocTreeEntry[] = [];

    const dirs = entries
      .filter((e) => e.isDirectory() && !isHiddenEntry(e.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const files = entries
      .filter((e) => e.isFile() && isDocExtension(e.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of dirs) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      nodes.push({
        type: "folder",
        path: rel.replace(/\\/g, "/"),
        name: folderDisplayName(full, rel.replace(/\\/g, "/")),
        icon: folderIcon(full),
        children: walkDir(full, rel.replace(/\\/g, "/")),
      });
    }

    for (const entry of files) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      const content = fs.readFileSync(full, "utf8");
      const doc = parseDocFile(rel.replace(/\\/g, "/"), content, statMtimeIso(full));
      nodes.push({
        type: "doc",
        path: doc.path,
        title: doc.title,
        icon: doc.icon,
        updated_at: doc.updated_at,
      });
    }

    return nodes;
  }

  return walkDir(docsDir, "");
}

export function readDocFile(
  docsDir: string,
  rel: string,
): {
  path: string;
  content: string;
  title: string;
  icon: string;
  updated_at: string;
} | null {
  const resolved = resolveDocPath(docsDir, rel);
  if (!resolved || !fs.existsSync(resolved.absolute)) {
    return null;
  }
  const stat = fs.statSync(resolved.absolute);
  if (!stat.isFile()) {
    return null;
  }
  const raw = fs.readFileSync(resolved.absolute, "utf8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    path: resolved.relative,
    content: body,
    title: titleFromContent(meta, body, resolved.relative),
    icon: meta.icon ?? DEFAULT_DOC_ICON,
    updated_at: stat.mtime.toISOString(),
  };
}

export function writeDocFile(
  docsDir: string,
  rel: string,
  content: string,
  metaOverrides?: DocFrontmatter,
): {
  path: string;
  content: string;
  title: string;
  icon: string;
  updated_at: string;
} {
  const resolved = resolveDocPath(docsDir, rel);
  if (!resolved) {
    throw new Error("Invalid document path");
  }

  let meta: DocFrontmatter = metaOverrides ?? {};
  let body = content;
  if (fs.existsSync(resolved.absolute)) {
    const parsed = parseFrontmatter(fs.readFileSync(resolved.absolute, "utf8"));
    meta = { ...parsed.meta, ...metaOverrides };
    body = content;
  } else {
    const parsed = parseFrontmatter(content);
    if (parsed.meta.title || parsed.meta.icon) {
      meta = { ...parsed.meta, ...metaOverrides };
      body = parsed.body;
    }
  }

  const fileContent = composeDocument(meta, body);
  fs.mkdirSync(path.dirname(resolved.absolute), { recursive: true });
  fs.writeFileSync(resolved.absolute, fileContent, "utf8");
  return {
    path: resolved.relative,
    content: body,
    title: titleFromContent(meta, body, resolved.relative),
    icon: meta.icon ?? DEFAULT_DOC_ICON,
    updated_at: statMtimeIso(resolved.absolute),
  };
}

export function updateDocFile(
  docsDir: string,
  rel: string,
  updates: { content?: string; title?: string; icon?: string },
): ReturnType<typeof readDocFile> {
  const existing = readDocFile(docsDir, rel);
  if (!existing) return null;

  const resolved = resolveDocPath(docsDir, rel)!;
  const raw = fs.readFileSync(resolved.absolute, "utf8");
  const parsed = parseFrontmatter(raw);
  const meta: DocFrontmatter = {
    ...parsed.meta,
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
  };
  const body = updates.content !== undefined ? updates.content : parsed.body;
  fs.writeFileSync(resolved.absolute, composeDocument(meta, body), "utf8");
  return readDocFile(docsDir, rel);
}

export function deleteDocFile(docsDir: string, rel: string): boolean {
  const resolved = resolveDocPath(docsDir, rel);
  if (!resolved || !fs.existsSync(resolved.absolute)) {
    return false;
  }
  fs.unlinkSync(resolved.absolute);
  return true;
}

export function createDocFolder(
  docsDir: string,
  rel: string,
  options?: { name?: string; icon?: string },
): TrailDocFolderMeta | null {
  const resolved = resolveFolderPath(docsDir, rel);
  if (!resolved) return null;
  fs.mkdirSync(resolved.absolute, { recursive: true });
  const meta = {
    name: options?.name ?? folderDisplayName(resolved.absolute, resolved.relative),
    icon: options?.icon ?? DEFAULT_FOLDER_ICON,
  };
  fs.writeFileSync(
    path.join(resolved.absolute, FOLDER_META_FILE),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
  return {
    path: resolved.relative,
    name: meta.name,
    icon: meta.icon,
  };
}

export function updateDocFolder(
  docsDir: string,
  rel: string,
  updates: { name?: string; icon?: string },
): TrailDocFolderMeta | null {
  const resolved = resolveFolderPath(docsDir, rel);
  if (!resolved || !fs.existsSync(resolved.absolute)) return null;
  const existing = readFolderMeta(resolved.absolute);
  const meta = {
    name: updates.name ?? existing?.name ?? path.basename(resolved.relative),
    icon: updates.icon ?? existing?.icon ?? DEFAULT_FOLDER_ICON,
  };
  fs.writeFileSync(
    path.join(resolved.absolute, FOLDER_META_FILE),
    `${JSON.stringify(meta, null, 2)}\n`,
    "utf8",
  );
  return { path: resolved.relative, name: meta.name, icon: meta.icon };
}

/** Suggests a unique `.md` filename from a human title. */
export function slugifyDocPath(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `${slug}.md` : "untitled.md";
}

export function uniqueDocPath(docsDir: string, basePath: string): string {
  const resolved = resolveDocPath(docsDir, basePath);
  if (!resolved) {
    return basePath.endsWith(".md") ? basePath : `${basePath}.md`;
  }
  if (!fs.existsSync(resolved.absolute)) {
    return resolved.relative;
  }
  const ext = path.extname(resolved.relative);
  const stem = resolved.relative.slice(0, -ext.length);
  let n = 2;
  while (true) {
    const candidate = `${stem}-${n}${ext}`;
    const next = resolveDocPath(docsDir, candidate);
    if (next && !fs.existsSync(next.absolute)) {
      return next.relative;
    }
    n += 1;
  }
}
