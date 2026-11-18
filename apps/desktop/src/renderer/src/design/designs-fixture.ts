export type DesignScreen = { name: string; version: string; active?: boolean; dot?: "violet" };

export type DesignVersion = {
  version: string;
  chip: string;
  chipTone: "violet" | "mint" | "gray";
  hash: string;
  summary: string;
  meta: string;
  extra?: string;
  active?: boolean;
  actions?: boolean;
};

const SCREENS: DesignScreen[] = [
  { name: "Dashboard", version: "v3", active: true },
  { name: "Board", version: "v3", dot: "violet" },
  { name: "Roadmap", version: "v1" },
  { name: "Decisions", version: "v1" },
  { name: "Docs", version: "v1" },
  { name: "Worktree", version: "v2" },
  { name: "Sign-in", version: "v2" },
];

const VERSIONS: DesignVersion[] = [
  {
    version: "v4",
    chip: "Proposed",
    chipTone: "violet",
    hash: "pending",
    summary: "Add worktrees panel and autopilot chip",
    meta: "Claude Design · today 14:12",
    extra: "Pull request #53 into development",
    actions: true,
  },
  {
    version: "v3",
    chip: "Approved",
    chipTone: "mint",
    hash: "a41c9e2",
    summary: "Centre the content, add worktrees panel",
    meta: "Claude · today 13:37",
    extra: "Linked tasks #42, #45",
    active: true,
  },
  {
    version: "v2",
    chip: "Superseded",
    chipTone: "gray",
    hash: "7be03d1",
    summary: "Desktop shell with rail, tree and inspector",
    meta: "Claude · today 13:10",
  },
  {
    version: "v1",
    chip: "Superseded",
    chipTone: "gray",
    hash: "2f9a6c8",
    summary: "First dashboard, page layout",
    meta: "Claude · today 12:02",
  },
];

export function getDesignsFixture() {
  return {
    screens: SCREENS,
    versions: VERSIONS,
    activeScreen: "Dashboard",
    filePath: "design/dashboard/v3.html",
    statusChip: "v3 approved",
  };
}