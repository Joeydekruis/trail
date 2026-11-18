import type { WorkspaceDto } from "@trail/ipc";

export type WtDot = "base" | "running" | "review" | "waiting" | "queued" | "merged";

export type WorktreeNavRow = {
  title: string;
  sub: string;
  dot: WtDot;
};

export type DashboardFixture = {
  repo: string;
  wsKey: string;
  tool: string;
  apCount: string;
  runText: string;
  nLocal: number;
  nRemote: number;
  local: WorktreeNavRow[];
  remote: WorktreeNavRow[];
  panelRows: WorktreePanelRow[];
};

export type WorktreePanelRow = {
  agentInitials: string;
  agentName: string;
  agentTone: "blue" | "claude";
  issue: string;
  title: string;
  output: string;
  chip: string;
  chipTone: "mint" | "violet" | "amber" | "gray";
  duration: string;
};

const DOT: Record<WtDot, string> = {
  base: "var(--ink-faint)",
  running: "var(--mint)",
  review: "var(--violet)",
  waiting: "var(--amber)",
  queued: "var(--ink-faint)",
  merged: "var(--ink-faint)",
};

export function dotColor(dot: WtDot): string {
  return DOT[dot];
}

const WS_DATA: Record<string, Omit<DashboardFixture, "repo">> = {
  trail: {
    wsKey: "Ctrl 1",
    tool: "Cursor CLI",
    apCount: "1 of 2",
    runText: "1 worktree running",
    nLocal: 3,
    nRemote: 3,
    local: [
      { title: "development", sub: "base checkout", dot: "base" },
      { title: "#42 Fix redirect after sign-in", sub: "agent/42-fix-redirect", dot: "running" },
      { title: "#45 Sync labels when an issue closes", sub: "agent/45-label-sync", dot: "queued" },
      { title: "#44 Store decisions in GitHub", sub: "agent/44-adr-store · waiting on ADR-012", dot: "waiting" },
    ],
    remote: [
      { title: "#38 Export decisions to Markdown", sub: "agent/38-adr-export · PR #51 draft", dot: "review" },
      { title: "#34 Fix label colours", sub: "hotfix/34-label-colours · development and main", dot: "merged" },
      { title: "#36 Read issues from GitHub", sub: "agent/36-read-issues · PR #41 merged", dot: "merged" },
    ],
    panelRows: [
      {
        agentInitials: "CU",
        agentName: "Cursor",
        agentTone: "blue",
        issue: "#42",
        title: "Fix redirect after sign-in",
        output: "› Running tests: 12 passed, 0 failed · agent/42-fix-redirect",
        chip: "Running",
        chipTone: "mint",
        duration: "04:12",
      },
      {
        agentInitials: "CL",
        agentName: "Claude",
        agentTone: "claude",
        issue: "#38",
        title: "Export decisions to Markdown",
        output: "› Opened draft pull request #51 · agent/38-adr-export",
        chip: "Draft PR",
        chipTone: "violet",
        duration: "11:40",
      },
      {
        agentInitials: "CL",
        agentName: "Claude",
        agentTone: "claude",
        issue: "#44",
        title: "Store decisions in GitHub",
        output: "› Paused: needs ADR-012 to be accepted or rejected · agent/44-adr-store",
        chip: "Waiting for decision",
        chipTone: "amber",
        duration: "07:55",
      },
      {
        agentInitials: "CU",
        agentName: "Cursor",
        agentTone: "blue",
        issue: "#45",
        title: "Sync labels when an issue closes",
        output: "› Waiting for a free slot · from Backlog to Todo",
        chip: "Queued",
        chipTone: "gray",
        duration: "",
      },
    ],
  },
  loupe: {
    wsKey: "Ctrl 2",
    tool: "Cursor CLI",
    apCount: "1 of 2",
    runText: "1 worktree running",
    nLocal: 1,
    nRemote: 2,
    local: [
      { title: "development", sub: "base checkout", dot: "base" },
      { title: "#12 Pin comments on pages", sub: "agent/12-pin-comments", dot: "running" },
    ],
    remote: [
      { title: "#15 Export pins as issues", sub: "agent/15-issue-export · PR #19 draft", dot: "review" },
      { title: "#9 Fix pin offset on scroll", sub: "hotfix/9-pin-offset · development and main", dot: "merged" },
    ],
    panelRows: [],
  },
  dockyrd: {
    wsKey: "Ctrl 3",
    tool: "Cursor CLI",
    apCount: "1 of 2",
    runText: "1 worktree running",
    nLocal: 1,
    nRemote: 1,
    local: [
      { title: "development", sub: "base checkout", dot: "base" },
      { title: "#8 Add deploy hooks", sub: "agent/8-deploy-hooks", dot: "running" },
    ],
    remote: [{ title: "#6 Add health checks", sub: "agent/6-health-checks · PR #9 merged", dot: "merged" }],
    panelRows: [],
  },
};

const REPO: Record<string, string> = { trail: "trail", loupe: "loupe", dockyrd: "dockyrd" };

export function getDashboardFixture(workspace: WorkspaceDto | undefined): DashboardFixture {
  const id = workspace?.id ?? "trail";
  const base = WS_DATA[id] ?? WS_DATA.trail;
  return {
    ...base,
    repo: REPO[id] ?? workspace?.name.toLowerCase() ?? "trail",
    panelRows: WS_DATA.trail.panelRows,
  };
}

export function workspaceShortcut(index: number, platform: string): string {
  const mod = platform === "darwin" ? "Cmd" : "Ctrl";
  return `${mod} ${index + 1}`;
}