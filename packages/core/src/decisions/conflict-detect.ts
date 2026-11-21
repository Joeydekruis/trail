import type { DecisionRecord } from "./types.js";

export type DecisionContentConflict = {
  adrIdA: string;
  adrIdB: string;
  topic: string;
  summary: string;
};

type TaskStoreClaim = "github" | "trail";

function normalizePair(a: string, b: string): { adrIdA: string; adrIdB: string } {
  return a < b ? { adrIdA: a, adrIdB: b } : { adrIdA: b, adrIdB: a };
}

export function taskStoreClaimFromMarkdown(markdown: string): TaskStoreClaim | null {
  const text = markdown.toLowerCase();
  if (
    /github issues?/.test(text) &&
    (/source of truth/.test(text) || /task store/.test(text) || /cache only/.test(text))
  ) {
    return "github";
  }
  if (
    (/trail/.test(text) || /sqlite/.test(text)) &&
    (/own database/.test(text) || /local database/.test(text) || /task store/.test(text))
  ) {
    return "trail";
  }
  return null;
}

/** Find accepted ADR pairs that contradict each other on where tasks live. */
export function detectDecisionContentConflicts(
  records: DecisionRecord[],
): DecisionContentConflict[] {
  const accepted = records.filter((record) => record.status === "accepted");
  const claims = accepted
    .map((record) => ({
      record,
      claim: taskStoreClaimFromMarkdown(record.decisionMarkdown),
    }))
    .filter((entry): entry is { record: DecisionRecord; claim: TaskStoreClaim } => entry.claim !== null);

  const github = claims.find((entry) => entry.claim === "github");
  const trail = claims.find((entry) => entry.claim === "trail");
  if (!github || !trail || github.record.adrId === trail.record.adrId) {
    return [];
  }

  const pair = normalizePair(github.record.adrId, trail.record.adrId);
  return [
    {
      ...pair,
      topic: "task_store",
      summary: `${github.record.adrId} and ${trail.record.adrId} are both Accepted but disagree on where tasks live.`,
    },
  ];
}