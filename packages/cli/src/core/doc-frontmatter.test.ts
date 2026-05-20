import { describe, expect, it } from "vitest";

import { composeDocument, parseFrontmatter } from "./doc-frontmatter.js";

describe("doc-frontmatter", () => {
  it("round-trips title and icon", () => {
    const raw = composeDocument(
      { title: "Spec", icon: "📄" },
      "# Spec\n\nBody",
    );
    const { meta, body } = parseFrontmatter(raw);
    expect(meta.title).toBe("Spec");
    expect(meta.icon).toBe("📄");
    expect(body).toContain("Body");
  });

  it("returns full string as body when no frontmatter", () => {
    const { meta, body } = parseFrontmatter("# Hello");
    expect(meta).toEqual({});
    expect(body).toBe("# Hello");
  });
});
