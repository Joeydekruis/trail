import type { WorkspaceDto } from "@trail/ipc";

export type BoardCard = {
  issue: string;
  title: string;
  prioColor: string;
  prioLabel: string;
  labels: { text: string; tone: "blue" | "mint" | "gray" | "violet" }[];
  syncStatus?: "synced" | "conflict" | "pending";
  adr?: string;
  pr?: string;
  prTone?: "violet" | "blue";
  agent?: { initials: string; tone: "blue" | "claude" | "mint" };
  orderText?: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  count: number;
  tone: "gray" | "blue" | "mint" | "violet" | "amber";
  ghLabel: string;
  autopilotHint?: boolean;
  cards: BoardCard[];
};

const COLUMNS: BoardColumn[] = [
  {
    id: "backlog",
    name: "Backlog",
    count: 4,
    tone: "gray",
    ghLabel: "Projects: Backlog",
    cards: [
      {
        issue: "#45",
        title: "Sync labels when an issue closes",
        prioColor: "var(--ink-muted)",
        prioLabel: "Low",
        labels: [{ text: "chore", tone: "gray" }],
      },
      {
        issue: "#46",
        title: "Link decisions to issues",
        prioColor: "var(--blue)",
        prioLabel: "Medium",
        labels: [{ text: "feature", tone: "blue" }],
        adr: "ADR-011",
      },
    ],
  },
  {
    id: "todo",
    name: "Todo",
    count: 3,
    tone: "blue",
    ghLabel: "Projects: Todo",
    autopilotHint: true,
    cards: [
      {
        issue: "#47",
        title: "Add a Ctrl K command palette",
        prioColor: "var(--amber)",
        prioLabel: "High",
        labels: [{ text: "ux", tone: "violet" }],
        orderText: "Picks up next",
      },
      {
        issue: "#48",
        title: "Board drag-and-drop to GitHub",
        prioColor: "var(--blue)",
        prioLabel: "Medium",
        labels: [{ text: "feature", tone: "blue" }],
        orderText: "Then #2",
      },
    ],
  },
  {
    id: "in-progress",
    name: "In progress",
    count: 2,
    tone: "mint",
    ghLabel: "open PR linked",
    cards: [
      {
        issue: "#42",
        title: "Fix redirect after sign-in",
        prioColor: "var(--amber)",
        prioLabel: "High",
        labels: [{ text: "bug", tone: "mint" }],
        agent: { initials: "CU", tone: "blue" },
        pr: "Draft #49",
        prTone: "violet",
      },
      {
        issue: "#37",
        title: "Sync board columns with Projects",
        prioColor: "var(--blue)",
        prioLabel: "Medium",
        labels: [{ text: "sync", tone: "blue" }],
        agent: { initials: "CL", tone: "claude" },
      },
    ],
  },
  {
    id: "in-review",
    name: "In review",
    count: 1,
    tone: "violet",
    ghLabel: "draft PR",
    cards: [
      {
        issue: "#38",
        title: "Export decisions to Markdown",
        prioColor: "var(--blue)",
        prioLabel: "Medium",
        labels: [{ text: "feature", tone: "blue" }],
        adr: "ADR-011",
        pr: "PR #51 draft",
        prTone: "violet",
        agent: { initials: "CL", tone: "claude" },
      },
    ],
  },
  {
    id: "done",
    name: "Done",
    count: 2,
    tone: "gray",
    ghLabel: "closed or merged",
    cards: [
      {
        issue: "#34",
        title: "Fix label colours",
        prioColor: "var(--ink-muted)",
        prioLabel: "Low",
        labels: [{ text: "bug", tone: "gray" }],
        pr: "Merged",
        prTone: "violet",
      },
    ],
  },
];

export type BoardListRow = {
  issue: string;
  title: string;
  adr: string;
  pr: string;
  syncLabel: string;
  syncState?: "synced" | "conflict" | "pending";
  by: string;
};

export type BoardListGroup = {
  name: string;
  tone: BoardColumn["tone"];
  count: number;
  rows: BoardListRow[];
  moreText?: string;
};

const LIST_GROUPS: BoardListGroup[] = [
  {
    name: "Backlog",
    tone: "gray",
    count: 4,
    rows: [
      { issue: "#45", title: "Sync labels when an issue closes", adr: "—", pr: "—", syncLabel: "Synced", by: "—" },
      { issue: "#46", title: "Link decisions to issues", adr: "ADR-011", pr: "—", syncLabel: "Synced", by: "—" },
    ],
  },
  {
    name: "Todo",
    tone: "blue",
    count: 3,
    rows: [
      { issue: "#47", title: "Add a Ctrl K command palette", adr: "—", pr: "—", syncLabel: "Synced", by: "—" },
    ],
  },
  {
    name: "In progress",
    tone: "mint",
    count: 2,
    rows: [
      { issue: "#42", title: "Fix redirect after sign-in", adr: "—", pr: "Draft #49", syncLabel: "Synced", by: "CU" },
    ],
    moreText: "1 more in this column",
  },
  {
    name: "In review",
    tone: "violet",
    count: 1,
    rows: [
      { issue: "#38", title: "Export decisions to Markdown", adr: "ADR-011", pr: "PR #51 draft", syncLabel: "Synced", by: "CL" },
    ],
  },
  {
    name: "Done",
    tone: "gray",
    count: 2,
    rows: [
      { issue: "#34", title: "Fix label colours", adr: "—", pr: "Merged", syncLabel: "Synced", by: "You" },
    ],
  },
];

export function getBoardFixture(workspace: WorkspaceDto | undefined): {
  repo: string;
  milestone: string;
  openCount: number;
  columns: BoardColumn[];
  listGroups: BoardListGroup[];
} {
  const repo = workspace?.id ?? "trail";
  return {
    repo,
    milestone: "v0.1",
    openCount: 12,
    columns: COLUMNS,
    listGroups: LIST_GROUPS,
  };
}