import type {
  BoardSnapshotResult,
  DecisionSummaryDto,
  KnowledgeDocSummaryDto,
  WorktreeDto,
} from "@trail/ipc";
import type { PaletteGroup, PaletteItem } from "./design/palette-fixture";
import type { ShellView } from "./design/shell-layout";
import { issueNumberFromRef } from "./worktree-session";

export type PaletteCatalog = {
  board: BoardSnapshotResult | null;
  decisions: DecisionSummaryDto[];
  docs: KnowledgeDocSummaryDto[];
};

const PAGE_ROWS: Array<[string, string, ShellView]> = [
  ["Dashboard", "Overview", "dashboard"],
  ["Board", "Kanban", "board"],
  ["Roadmap", "Epics and milestones", "roadmap"],
  ["Decisions", "ADRs", "decisions"],
  ["Docs", "Trail knowledge", "docs"],
  ["Designs", "Design versions", "designs"],
  ["Settings", "Workspace preferences", "settings"],
];

function matchesQuery(query: string, title: string, sub: string): boolean {
  if (!query.trim()) {
    return true;
  }
  const haystack = `${title} ${sub}`.toLowerCase();
  return haystack.includes(query.toLowerCase().trim());
}

function filterItems(items: PaletteItem[], query: string): PaletteItem[] {
  return items.filter((item) => matchesQuery(query, item.title, item.sub));
}

function group(name: string, items: PaletteItem[], query: string): PaletteGroup | null {
  const visible = filterItems(items, query);
  if (visible.length === 0) {
    return null;
  }
  return { name, items: visible };
}

export function buildCommandPaletteGroups(input: {
  query: string;
  worktrees: WorktreeDto[];
  catalog: PaletteCatalog | null;
}): PaletteGroup[] {
  const { query, worktrees, catalog } = input;
  const groups: PaletteGroup[] = [];

  const pages: PaletteItem[] = PAGE_ROWS.map(([title, sub, view]) => ({
    title,
    sub,
    hint: "Page",
    target: { type: "view", view },
  }));
  const pagesGroup = group("Pages", pages, query);
  if (pagesGroup) {
    groups.push(pagesGroup);
  }

  const worktreeItems: PaletteItem[] = worktrees.map((wt) => ({
    title: `#${wt.issueNumber} ${wt.title}`,
    sub: wt.branch,
    hint: "Worktree",
    target: { type: "worktree", issueNumber: wt.issueNumber },
  }));
  const worktreeGroup = group("Worktrees", worktreeItems, query);
  if (worktreeGroup) {
    groups.push(worktreeGroup);
  }

  const taskItems: PaletteItem[] = [];
  if (catalog?.board) {
    for (const column of catalog.board.columns) {
      for (const card of column.cards) {
        const issueNumber = issueNumberFromRef(card.issue);
        if (issueNumber === null) {
          continue;
        }
        taskItems.push({
          title: `${card.issue} ${card.title}`,
          sub: column.name,
          hint: "Task",
          target: { type: "open-issue", issueNumber, title: card.title },
        });
      }
    }
  }
  const taskGroup = group("Tasks", taskItems, query);
  if (taskGroup) {
    groups.push(taskGroup);
  }

  const decisionItems: PaletteItem[] = (catalog?.decisions ?? []).map((row) => ({
    title: `${row.adrId} ${row.title}`,
    sub: row.status,
    hint: "Decision",
    target: { type: "open-decision", adrId: row.adrId, title: row.title },
  }));
  const decisionGroup = group("Decisions", decisionItems, query);
  if (decisionGroup) {
    groups.push(decisionGroup);
  }

  const docItems: PaletteItem[] = (catalog?.docs ?? []).map((row) => ({
    title: row.title,
    sub: row.slug,
    hint: "Doc",
    target: { type: "open-doc", slug: row.slug, title: row.title },
  }));
  const docGroup = group("Docs", docItems, query);
  if (docGroup) {
    groups.push(docGroup);
  }

  const actions: PaletteItem[] = [
    { title: "New task", sub: "", hint: "Action", target: { type: "new-task" } },
    { title: "Sync now", sub: "", hint: "Action", target: { type: "sync" } },
    { title: "Open settings", sub: "", hint: "Action", target: { type: "settings" } },
  ];
  if (worktrees.length > 0) {
    const first = worktrees[0];
    actions.push({
      title: "Open latest worktree",
      sub: `#${first.issueNumber}`,
      hint: "Action",
      target: { type: "worktree", issueNumber: first.issueNumber },
    });
  }
  const actionGroup = group("Actions", actions, query);
  if (actionGroup) {
    groups.push(actionGroup);
  }

  return groups;
}

export function flattenPalette(groups: PaletteGroup[]): PaletteItem[] {
  return groups.flatMap((g) => g.items);
}