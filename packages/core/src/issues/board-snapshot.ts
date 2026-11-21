import { BOARD_COLUMN_META, BOARD_COLUMN_ORDER, type BoardColumnId } from "./columns.js";
import { compareByPriority, priorityDisplay } from "./priority.js";
import type { IssueCacheRecord } from "./types.js";

export type IssueCardSyncStatus = "synced" | "conflict" | "pending";

export type BoardCardSnapshot = {
  issue: string;
  title: string;
  prioColor: string;
  prioLabel: string;
  labels: Array<{ text: string; tone: "blue" | "mint" | "gray" | "violet" }>;
  syncStatus: IssueCardSyncStatus;
};

export type BoardColumnSnapshot = {
  id: BoardColumnId;
  name: string;
  count: number;
  tone: (typeof BOARD_COLUMN_META)[BoardColumnId]["tone"];
  ghLabel: string;
  cards: BoardCardSnapshot[];
};

export type BoardSnapshot = {
  source: "cache";
  openCount: number;
  columns: BoardColumnSnapshot[];
};

function labelTone(name: string): BoardCardSnapshot["labels"][number]["tone"] {
  const lower = name.toLowerCase();
  if (lower.includes("bug") || lower.includes("fix")) {
    return "mint";
  }
  if (lower.includes("design")) {
    return "violet";
  }
  if (lower.includes("feature") || lower.includes("sync")) {
    return "blue";
  }
  return "gray";
}

export type BuildBoardSnapshotOptions = {
  conflictIssueNumbers?: ReadonlySet<number>;
};

export function buildBoardSnapshot(
  issues: IssueCacheRecord[],
  options?: BuildBoardSnapshotOptions,
): BoardSnapshot {
  const conflicts = options?.conflictIssueNumbers;
  const columns: BoardColumnSnapshot[] = BOARD_COLUMN_ORDER.map((id) => {
    const meta = BOARD_COLUMN_META[id];
    return {
      id,
      name: meta.name,
      count: 0,
      tone: meta.tone,
      ghLabel: meta.ghLabel,
      cards: [],
    };
  });

  const byId = new Map(columns.map((column) => [column.id, column]));

  const sorted = [...issues].sort((a, b) => {
    const byPrio = compareByPriority(a.priority, b.priority);
    if (byPrio !== 0) {
      return byPrio;
    }
    return a.number - b.number;
  });

  for (const issue of sorted) {
    const column = byId.get(issue.boardColumn) ?? byId.get("backlog");
    if (!column) {
      continue;
    }
    const display = priorityDisplay(issue.priority);
    column.cards.push({
      issue: `#${issue.number}`,
      title: issue.title,
      prioColor: display.color,
      prioLabel: display.label,
      labels: issue.labels.slice(0, 4).map((text) => ({ text, tone: labelTone(text) })),
      syncStatus: conflicts?.has(issue.number) ? "conflict" : "synced",
    });
    column.count = column.cards.length;
  }

  const openCount = issues.filter((issue) => issue.state === "open").length;

  return {
    source: "cache",
    openCount,
    columns,
  };
}