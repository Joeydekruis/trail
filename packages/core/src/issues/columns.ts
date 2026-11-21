export type BoardColumnId = "backlog" | "todo" | "in-progress" | "in-review" | "done";

export const BOARD_COLUMN_ORDER: readonly BoardColumnId[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
] as const;

export const BOARD_COLUMN_META: Record<
  BoardColumnId,
  { name: string; ghLabel: string; tone: "gray" | "blue" | "mint" | "violet" | "amber" }
> = {
  backlog: { name: "Backlog", ghLabel: "Projects: Backlog", tone: "gray" },
  todo: { name: "Todo", ghLabel: "Projects: Todo", tone: "blue" },
  "in-progress": { name: "In progress", ghLabel: "Projects: In progress", tone: "mint" },
  "in-review": { name: "In review", ghLabel: "open PR linked", tone: "violet" },
  done: { name: "Done", ghLabel: "closed or merged", tone: "amber" },
};

/** Default column when Projects v2 status is not cached yet. */
export function defaultBoardColumn(state: string): BoardColumnId {
  if (state === "closed") {
    return "done";
  }
  return "backlog";
}