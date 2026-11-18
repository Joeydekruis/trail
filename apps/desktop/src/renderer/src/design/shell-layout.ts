export const SHELL_VIEWS = [
  "dashboard",
  "board",
  "roadmap",
  "decisions",
  "docs",
  "designs",
  "settings",
] as const;

export type ShellView = (typeof SHELL_VIEWS)[number];

/** Center column content — rail pages or the #42 worktree tab. */
export type CenterView = ShellView | "worktree";

export const SHELL_VIEW_LABELS: Record<ShellView, string> = {
  dashboard: "Dashboard",
  board: "Board",
  roadmap: "Roadmap",
  decisions: "Decisions",
  docs: "Docs",
  designs: "Designs",
  settings: "Settings",
};

export function isShellView(id: string): id is ShellView {
  return (SHELL_VIEWS as readonly string[]).includes(id);
}

/** Worktree project sidebar (256px) — dashboard and worktree per briefing. */
export function shellShowsWorktreeSidebar(center: CenterView): boolean {
  return center === "dashboard" || center === "worktree";
}

export function shellShowsInspector(center: CenterView): boolean {
  return center === "dashboard";
}

export function shellShowsComposer(center: CenterView): boolean {
  return center === "dashboard";
}

/** Center column uses internal scroll + max-width unless full-bleed. */
export function shellUsesScrollCanvas(center: CenterView): boolean {
  return (
    center !== "board" &&
    center !== "designs" &&
    center !== "settings" &&
    center !== "worktree"
  );
}

export function shellContentMaxWidth(center: CenterView): number {
  return center === "dashboard" ? 1100 : 1200;
}

export function isShellViewCenter(center: CenterView): center is ShellView {
  return center !== "worktree";
}