import type { ShellView } from "./shell-layout";

export type PaletteTarget =
  | { type: "view"; view: ShellView }
  | { type: "worktree" }
  | { type: "sync" }
  | { type: "new-task" };

export type PaletteItem = {
  title: string;
  sub: string;
  hint: string;
  target: PaletteTarget;
};

export type PaletteGroup = {
  name: string;
  items: PaletteItem[];
};

const RAW: [string, [string, string, PaletteTarget][], string][] = [
  [
    "Pages",
    [
      ["Dashboard", "Overview", { type: "view", view: "dashboard" }],
      ["Board", "Kanban", { type: "view", view: "board" }],
      ["Roadmap", "Epics and milestones", { type: "view", view: "roadmap" }],
      ["Decisions", "ADRs", { type: "view", view: "decisions" }],
      ["Docs", "docs folder", { type: "view", view: "docs" }],
      ["Designs", "Design versions", { type: "view", view: "designs" }],
    ],
    "Page",
  ],
  [
    "Worktrees",
    [
      ["#42 Fix redirect after sign-in", "agent/42-fix-redirect", { type: "worktree" }],
      ["#45 Sync labels when an issue closes", "agent/45-label-sync", { type: "worktree" }],
      ["#38 Export decisions to Markdown", "agent/38-adr-export", { type: "worktree" }],
    ],
    "Worktree",
  ],
  [
    "Tasks",
    [
      ["#37 Sync board columns with Projects", "In progress", { type: "view", view: "board" }],
      ["#46 Link decisions to issues", "Todo", { type: "view", view: "board" }],
      ["#47 Add a Ctrl K command palette", "Todo", { type: "view", view: "board" }],
    ],
    "Task",
  ],
  [
    "Decisions",
    [
      ["ADR-012 Run agents in separate git worktrees", "Proposed", { type: "view", view: "decisions" }],
      ["ADR-011 Use GitHub issues as the task store", "Accepted", { type: "view", view: "decisions" }],
      ["ADR-010 Name the worktree after the task", "Accepted", { type: "view", view: "decisions" }],
    ],
    "Decision",
  ],
  [
    "Docs",
    [
      ["Worktrees", "docs/architecture/worktrees.md", { type: "view", view: "docs" }],
      ["Sync", "docs/architecture/sync.md", { type: "view", view: "docs" }],
    ],
    "Doc",
  ],
  [
    "Actions",
    [
      ["New task", "", { type: "new-task" }],
      ["New worktree", "", { type: "worktree" }],
      ["Sync now", "", { type: "sync" }],
    ],
    "Action",
  ],
];

export function filterPaletteGroups(query: string): PaletteGroup[] {
  const q = query.toLowerCase().trim();
  const groups: PaletteGroup[] = [];
  for (const [name, rows, hint] of RAW) {
    const items = rows
      .filter(([title, sub]) => !q || `${title} ${sub}`.toLowerCase().includes(q))
      .map(([title, sub, target]) => ({
        title,
        sub,
        hint,
        target,
      }));
    if (items.length > 0) groups.push({ name, items });
  }
  return groups;
}

export function flattenPalette(groups: PaletteGroup[]): PaletteItem[] {
  return groups.flatMap((g) => g.items);
}