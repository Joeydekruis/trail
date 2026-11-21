import { describe, expect, it } from "vitest";
import { knowledgeDocId, slugFromTitle } from "./slug.js";

describe("slugFromTitle", () => {
  it("slugifies titles", () => {
    expect(slugFromTitle("Worktrees")).toBe("worktrees");
    expect(knowledgeDocId("trail", "worktrees")).toBe("trail:worktrees");
  });
});