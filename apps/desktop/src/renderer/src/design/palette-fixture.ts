import type { ShellView } from "./shell-layout";

export type PaletteTarget =
  | { type: "view"; view: ShellView }
  | { type: "worktree"; issueNumber?: number }
  | { type: "sync" }
  | { type: "new-task" }
  | { type: "settings" }
  | { type: "open-issue"; issueNumber: number; title: string }
  | { type: "open-decision"; adrId: string; title: string }
  | { type: "open-doc"; slug: string; title: string };

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