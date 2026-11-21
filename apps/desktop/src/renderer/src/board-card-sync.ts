import type { BoardCard, BoardColumn, BoardListRow } from "./design/board-fixture";

export type IssueCardSyncStatus = NonNullable<BoardCard["syncStatus"]>;

export function syncLabelForStatus(status: IssueCardSyncStatus): string {
  if (status === "conflict") {
    return "Conflict";
  }
  if (status === "pending") {
    return "Pending";
  }
  return "Synced";
}

export function cardSyncStatus(card: BoardCard): IssueCardSyncStatus {
  return card.syncStatus ?? "synced";
}

export function boardListRowFromCard(card: BoardCard): BoardListRow {
  const syncState = cardSyncStatus(card);
  return {
    issue: card.issue,
    title: card.title,
    adr: "—",
    pr: "—",
    syncLabel: syncLabelForStatus(syncState),
    syncState,
    by: "—",
  };
}

export function withCardSyncStatus(
  columns: BoardColumn[],
  issueRef: string,
  syncStatus: IssueCardSyncStatus,
): BoardColumn[] {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => (card.issue === issueRef ? { ...card, syncStatus } : card)),
  }));
}