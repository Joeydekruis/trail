import { describe, expect, it } from "vitest";
import { detectDecisionContentConflicts, taskStoreClaimFromMarkdown } from "./conflict-detect.js";
import type { DecisionRecord } from "./types.js";

function record(overrides: Partial<DecisionRecord> & Pick<DecisionRecord, "adrId">): DecisionRecord {
  return {
    id: `ws:${overrides.adrId}`,
    workspaceId: "ws",
    title: overrides.adrId,
    status: "accepted",
    contextMarkdown: "",
    decisionMarkdown: "",
    consequencesMarkdown: "",
    author: "You",
    blocksIssueNumber: null,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("taskStoreClaimFromMarkdown", () => {
  it("detects GitHub-as-source and Trail-local claims", () => {
    expect(
      taskStoreClaimFromMarkdown("GitHub Issues + Projects v2 are source of truth; SQLite is cache only."),
    ).toBe("github");
    expect(taskStoreClaimFromMarkdown("Keep tasks in Trail's own database in SQLite.")).toBe("trail");
  });
});

describe("detectDecisionContentConflicts", () => {
  it("returns a pair when two accepted ADRs disagree on task store", () => {
    const conflicts = detectDecisionContentConflicts([
      record({
        adrId: "ADR-011",
        decisionMarkdown: "GitHub Issues are source of truth; SQLite is cache only.",
      }),
      record({
        adrId: "ADR-007",
        decisionMarkdown: "Trail keeps tasks in its own SQLite database as the task store.",
      }),
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.adrIdA).toBe("ADR-007");
    expect(conflicts[0]?.adrIdB).toBe("ADR-011");
  });

  it("ignores proposed or single-sided claims", () => {
    expect(
      detectDecisionContentConflicts([
        record({
          adrId: "ADR-011",
          status: "proposed",
          decisionMarkdown: "GitHub Issues are source of truth.",
        }),
      ]),
    ).toEqual([]);
  });
});