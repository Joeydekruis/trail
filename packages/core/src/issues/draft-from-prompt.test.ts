import { describe, expect, it } from "vitest";
import { draftIssueFromPrompt } from "./draft-from-prompt.js";

describe("draftIssueFromPrompt", () => {
  it("builds title and labels from prompt heuristics", () => {
    const draft = draftIssueFromPrompt(
      "Fix the sync retry button on failed cards. Users are blocked when sync fails.",
    );
    expect(draft.title).toMatch(/^Fix the sync retry/i);
    expect(draft.type).toBe("bug");
    expect(draft.priority).toBe("medium");
    expect(draft.body).toContain("Acceptance criteria");
  });

  it("detects docs and urgent priority", () => {
    const draft = draftIssueFromPrompt("Urgent: update README for desktop install");
    expect(draft.type).toBe("docs");
    expect(draft.priority).toBe("urgent");
  });
});