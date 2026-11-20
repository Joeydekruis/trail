import { BOARD_COLUMN_META, type BoardColumnId } from "./columns.js";

const STATUS_TO_COLUMN: Record<string, BoardColumnId> = {
  backlog: "backlog",
  todo: "todo",
  "in progress": "in-progress",
  "in review": "in-review",
  done: "done",
};

/** Maps a GitHub Projects v2 single-select Status value to a board column id. */
export function boardColumnFromProjectStatus(statusName: string): BoardColumnId | null {
  const key = statusName.trim().toLowerCase();
  return STATUS_TO_COLUMN[key] ?? null;
}

/** Preferred GitHub Projects single-select label for a board column. */
export function projectStatusNameForColumn(columnId: BoardColumnId): string {
  return BOARD_COLUMN_META[columnId].name;
}

/** Resolves the Projects v2 option id for a target board column. */
export function projectStatusOptionIdForColumn(
  columnId: BoardColumnId,
  options: Array<{ id: string; name: string }>,
): string | null {
  const preferred = projectStatusNameForColumn(columnId).toLowerCase();
  const direct = options.find((option) => option.name.trim().toLowerCase() === preferred);
  if (direct) {
    return direct.id;
  }
  for (const option of options) {
    if (boardColumnFromProjectStatus(option.name) === columnId) {
      return option.id;
    }
  }
  return null;
}