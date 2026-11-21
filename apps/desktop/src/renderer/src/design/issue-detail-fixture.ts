import type { BoardCard } from "./board-fixture";

export type IssueDetail = {
  issue: string;
  title: string;
  status: string;
  statusTone: "mint" | "blue" | "gray";
  labels: { text: string; tone: "blue" | "mint" | "gray" }[];
  prioLabel: string;
  prioColor: string;
  by: string;
  adr: string;
  pr: string;
  syncLabel: string;
  desc: string;
  steps: { text: string; done: boolean }[];
  nComments: number;
  comments: { who: string; initials: string; tone: "mint" | "blue"; when: string; text: string }[];
  activity: { when: string; text: string }[];
  cta: string;
  htmlUrl?: string;
};

const DETAILS: Record<string, IssueDetail> = {
  "#42": {
    issue: "#42",
    title: "Fix redirect after sign-in",
    status: "In progress",
    statusTone: "mint",
    labels: [
      { text: "bug", tone: "mint" },
      { text: "agent-ready", tone: "blue" },
    ],
    prioLabel: "High",
    prioColor: "var(--amber)",
    by: "Cursor CLI",
    adr: "—",
    pr: "Draft #49",
    syncLabel: "Synced",
    desc: "After sign-in, users should return to the page they came from. Today they always land on the dashboard.",
    steps: [
      { text: "Read and validate the next query parameter", done: true },
      { text: "Reject non-local redirect targets", done: true },
      { text: "Add regression tests for redirect", done: true },
      { text: "Disable sign-in button while loading", done: false },
    ],
    nComments: 3,
    comments: [
      {
        who: "Joey",
        initials: "JK",
        tone: "mint",
        when: "2 days ago",
        text: "Reproduced on staging — always goes to /dashboard.",
      },
      {
        who: "Cursor",
        initials: "CU",
        tone: "blue",
        when: "today",
        text: "PR draft opened with redirect fix and tests.",
      },
    ],
    activity: [
      { when: "14:08", text: "Agent edited SignInForm.tsx" },
      { when: "14:05", text: "Tests passed locally" },
      { when: "14:02", text: "Worktree started on agent/42-fix-redirect" },
    ],
    cta: "Open worktree",
  },
};

/** Parses sidebar / activity lines like `#42 Fix redirect after sign-in`. */
export function parseIssueTitleLine(line: string): { issue: string; title: string } | null {
  const trimmed = line.trim();
  const match = /^(#\d+)\s+(.+)$/.exec(trimmed);
  if (!match) {
    return null;
  }
  return { issue: match[1], title: match[2] };
}

export function getIssueDetailByRef(issue: string, title: string): IssueDetail {
  return getIssueDetail({
    issue,
    title,
    prioColor: "var(--blue)",
    prioLabel: "Medium",
    labels: [],
  });
}

export function getIssueDetail(card: BoardCard): IssueDetail {
  const base = DETAILS[card.issue];
  if (base) return base;
  return {
    issue: card.issue,
    title: card.title,
    status: "Todo",
    statusTone: "blue",
    labels: card.labels.map((l) => ({
      text: l.text,
      tone: l.tone === "violet" ? "gray" : l.tone,
    })),
    prioLabel: "Medium",
    prioColor: card.prioColor,
    by: card.agent?.initials ?? "—",
    adr: card.adr ?? "—",
    pr: card.pr ?? "—",
    syncLabel: "Synced",
    desc: card.title,
    steps: [{ text: "Define acceptance criteria", done: false }],
    nComments: 0,
    comments: [],
    activity: [],
    cta: "Start in worktree",
  };
}