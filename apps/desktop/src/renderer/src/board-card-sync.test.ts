import { describe, expect, it } from "vitest";
import { boardListRowFromCard, syncLabelForStatus, withCardSyncStatus } from "./board-card-sync";
import type { BoardCard, BoardColumn } from "./design/board-fixture";

const card = (issue: string, syncStatus?: BoardCard["syncStatus"]): BoardCard => ({
  issue,
  title: "Example",
  prioColor: "var(--blue)",
  prioLabel: "Medium",
  labels: [],
  syncStatus,
});

const column = (id: string, cards: BoardCard[]): BoardColumn => ({
  id,
  name: id,
  tone: "gray",
  count: cards.length,
  ghLabel: "",
  cards,
});

describe("syncLabelForStatus", () => {
  it("maps pending and conflict", () => {
    expect(syncLabelForStatus("pending")).toBe("Pending");
    expect(syncLabelForStatus("conflict")).toBe("Conflict");
    expect(syncLabelForStatus("synced")).toBe("Synced");
  });
});

describe("boardListRowFromCard", () => {
  it("includes pending sync state", () => {
    const row = boardListRowFromCard(card("#12", "pending"));
    expect(row.syncState).toBe("pending");
    expect(row.syncLabel).toBe("Pending");
  });
});

describe("withCardSyncStatus", () => {
  it("marks one card pending", () => {
    const columns = [column("todo", [card("#1"), card("#2", "conflict")])];
    const next = withCardSyncStatus(columns, "#1", "pending");
    expect(next[0].cards[0].syncStatus).toBe("pending");
    expect(next[0].cards[1].syncStatus).toBe("conflict");
  });
});