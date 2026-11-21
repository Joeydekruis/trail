import type { BoardListGroup, BoardListRow } from "./design/board-fixture";

export type FlatBoardListItem =
  | {
      type: "header";
      key: string;
      name: string;
      tone: BoardListGroup["tone"];
      count: number;
    }
  | { type: "row"; key: string; row: BoardListRow }
  | { type: "more"; key: string; text: string };

export function flattenBoardListGroups(groups: BoardListGroup[]): FlatBoardListItem[] {
  const out: FlatBoardListItem[] = [];
  for (const group of groups) {
    out.push({
      type: "header",
      key: `header:${group.name}`,
      name: group.name,
      tone: group.tone,
      count: group.count,
    });
    for (const row of group.rows) {
      out.push({ type: "row", key: `row:${row.issue}`, row });
    }
    if (group.moreText) {
      out.push({ type: "more", key: `more:${group.name}`, text: group.moreText });
    }
  }
  return out;
}