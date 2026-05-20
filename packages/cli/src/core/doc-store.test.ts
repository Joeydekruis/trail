import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  deleteDocFile,
  listDocs,
  readDocFile,
  resolveDocPath,
  slugifyDocPath,
  uniqueDocPath,
  writeDocFile,
} from "./doc-store.js";

describe("doc-store", () => {
  it("rejects path traversal and non-markdown extensions", () => {
    const docsDir = path.join(os.tmpdir(), "trail-docs-test");
    expect(resolveDocPath(docsDir, "../secret.md")).toBeNull();
    expect(resolveDocPath(docsDir, "notes.txt")).toBeNull();
  });

  it("round-trips list, read, write, and delete", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-doc-store-"));
    const docsDir = path.join(root, "docs");
    fs.mkdirSync(docsDir, { recursive: true });

    writeDocFile(docsDir, "guide.md", "# Guide\n\nHello");
    writeDocFile(docsDir, "nested/spec.md", "# Spec\n\nDetails");

    const listed = listDocs(docsDir);
    expect(listed.map((d) => d.path)).toEqual(["guide.md", "nested/spec.md"]);
    expect(listed[0]?.title).toBe("Guide");
    expect(listed[0]?.icon).toBe("📄");

    const read = readDocFile(docsDir, "guide.md");
    expect(read?.content).toContain("Hello");

    expect(deleteDocFile(docsDir, "guide.md")).toBe(true);
    expect(listDocs(docsDir).map((d) => d.path)).toEqual(["nested/spec.md"]);
  });

  it("slugify and unique paths avoid collisions", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "trail-doc-slug-"));
    const docsDir = path.join(root, "docs");
    fs.mkdirSync(docsDir, { recursive: true });

    expect(slugifyDocPath("My Design Doc")).toBe("my-design-doc.md");
    writeDocFile(docsDir, "my-design-doc.md", "# One");
    expect(uniqueDocPath(docsDir, "my-design-doc.md")).toBe("my-design-doc-2.md");
  });
});
