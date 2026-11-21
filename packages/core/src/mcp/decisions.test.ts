import { describe, expect, it } from "vitest";
import { decisionIdFromDoc, isDecisionDoc } from "./decisions.js";

describe("mcp decisions", () => {
  it("detects ADR docs by slug or title", () => {
    expect(isDecisionDoc("adr-001-foo", "Anything")).toBe(true);
    expect(isDecisionDoc("worktrees", "ADR-012 Run agents")).toBe(true);
    expect(isDecisionDoc("onboarding", "Onboarding")).toBe(false);
  });

  it("uses ADR id from title when present", () => {
    expect(
      decisionIdFromDoc({ slug: "adr-preview", title: "ADR-007 Electron pivot", updatedAt: "" }),
    ).toBe("ADR-007");
  });
});