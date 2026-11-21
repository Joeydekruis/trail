import { describe, expect, it } from "vitest";
import { formatDecisionMarkdown } from "./markdown.js";

describe("formatDecisionMarkdown", () => {
  it("includes ADR sections", () => {
    const md = formatDecisionMarkdown({
      adrId: "ADR-001",
      title: "Example",
      status: "proposed",
      author: "You",
      updatedAt: "2026-01-01T00:00:00.000Z",
      contextMarkdown: "Why now.",
      decisionMarkdown: "We chose X.",
      consequencesMarkdown: "Y follows.",
      blocksIssueNumber: 42,
    });
    expect(md).toContain("# ADR-001: Example");
    expect(md).toContain("## Context");
    expect(md).toContain("Why now.");
    expect(md).toContain("**Blocks issue:** #42");
  });
});