import type { WorkspaceDto } from "@trail/ipc";

export type DecisionListRow = {
  id: string;
  title: string;
  status: string;
  meta: string;
  conflict?: boolean;
};

export type DecisionDetail = {
  id: string;
  title: string;
  statusTone: "blue" | "mint" | "gray" | "amber";
  status: string;
  syncLabel: string;
  authorWhen: string;
  context: string;
  decision: string;
  consequences: string;
  affects: { issue: string; title: string; tone: "amber" | "mint"; chip: string; chipTone: "amber" | "gray" }[];
};

const ROWS: DecisionListRow[] = [
  { id: "ADR-012", title: "Run agents in separate git worktrees", status: "Proposed", meta: "Claude · today" },
  {
    id: "ADR-011",
    title: "Use GitHub issues as the task store",
    status: "Accepted",
    meta: "You · 2 days ago",
    conflict: true,
  },
  { id: "ADR-010", title: "Name the worktree after the task", status: "Accepted", meta: "You · 3 days ago" },
  { id: "ADR-009", title: "Keep one docs folder per repo", status: "Superseded", meta: "You · 5 days ago" },
  { id: "ADR-008", title: "Show sync state on every card", status: "Accepted", meta: "You · 1 week ago" },
  {
    id: "ADR-007",
    title: "Keep tasks in Trail's own database",
    status: "Accepted",
    meta: "You · 2 weeks ago",
    conflict: true,
  },
  { id: "ADR-006", title: "Use a custom git client", status: "Rejected", meta: "You · 2 weeks ago" },
];

const DETAIL_ADR_012: DecisionDetail = {
  id: "ADR-012",
  title: "Run agents in separate git worktrees",
  statusTone: "blue",
  status: "Proposed",
  syncLabel: "Not yet in GitHub",
  authorWhen: "Claude · today",
  context:
    "Agents need somewhere to work that does not disturb the checkout you are editing. A branch alone does not give them a working copy, and a chat alone does not say which task it belongs to.",
  decision:
    "Every task gets one worktree. A worktree is a branch, a working copy, an agent session and the linked task, kept together. It is created from development and removed after the pull request merges.",
  consequences:
    "Several tasks can run in parallel without touching each other. Disk use grows with the number of open worktrees, so Trail removes merged ones. This sits next to ADR-007 and ADR-011, which disagree about where tasks live.",
  affects: [
    {
      issue: "#44",
      title: "Store decisions in GitHub",
      tone: "amber",
      chip: "Waiting for decision",
      chipTone: "amber",
    },
    { issue: "#42", title: "Fix redirect after sign-in", tone: "mint", chip: "Not blocked", chipTone: "gray" },
  ],
};

const DETAILS: Record<string, DecisionDetail> = {
  "ADR-012": DETAIL_ADR_012,
};

export function getDecisionDetail(id: string): DecisionDetail {
  const known = DETAILS[id];
  if (known) {
    return known;
  }
  const row = ROWS.find((r) => r.id === id);
  return {
    id,
    title: row?.title ?? id,
    statusTone: row?.status === "Accepted" ? "mint" : row?.status === "Proposed" ? "blue" : "gray",
    status: row?.status ?? "Accepted",
    syncLabel: "Synced",
    authorWhen: row?.meta ?? "—",
    context: "Summary text for this decision lives in docs/decisions/ in the repository.",
    decision: row?.title ?? "",
    consequences: "Linked issues and worktrees update when this decision is accepted or rejected.",
    affects: [],
  };
}

export function getDecisionsFixture(workspace: WorkspaceDto | undefined) {
  const repo = workspace?.id ?? "trail";
  return {
    repo,
    total: 12,
    rows: ROWS,
    defaultDetail: DETAIL_ADR_012,
    conflictMessage: "ADR-011 and ADR-007 are both Accepted but disagree on where tasks live.",
  };
}