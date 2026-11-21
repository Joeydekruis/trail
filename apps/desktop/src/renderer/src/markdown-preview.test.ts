import { describe, expect, it } from "vitest";
import { splitMarkdownBlocks } from "./markdown-preview";

describe("splitMarkdownBlocks", () => {
  it("parses headings", () => {
    const blocks = splitMarkdownBlocks("# Title\n\n## Section\n\nBody text");
    expect(blocks.map((b) => b.kind)).toEqual(["h1", "h2", "p"]);
  });
});