import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { WorkspaceDto, WorkspaceGithubSnapshot } from "@trail/ipc";
import { formatSyncLabel } from "./sync-label";
import { CommandPalette } from "./CommandPalette";
import { NewTaskModal } from "./NewTaskModal";
import { IssueDetailModal } from "./IssueDetailModal";
import { getIssueDetailByRef, parseIssueTitleLine, type IssueDetail } from "./design/issue-detail-fixture";
import { BoardView } from "./BoardView";
import { DecisionsView } from "./DecisionsView";
import { DesignsView } from "./DesignsView";
import { DocsView } from "./DocsView";
import { RoadmapView } from "./RoadmapView";
import { SettingsView } from "./SettingsView";
import { WorktreeView } from "./WorktreeView";
import { dotColor, getDashboardFixture, workspaceShortcut } from "./design/fixture";
import type { PaletteItem } from "./design/palette-fixture";
import {
  shellContentMaxWidth,
  shellShowsComposer,
  shellShowsInspector,
  shellShowsWorktreeSidebar,
  shellUsesScrollCanvas,
  SHELL_VIEW_LABELS,
  isShellViewCenter,
  type CenterView,
  type ShellView,
} from "./design/shell-layout";
import { TrailComposer } from "./design/TrailComposer";
import {
  ActivityItem,
  ConflictBanner,
  DecisionRow,
  KanbanCard,
  SelectButton,
  SyncStatus,
  TrailAvatar,
  TrailButton,
  TrailChip,
  TrailPanel,
  TrailStatTile,
} from "./design/TrailUi";
import {
  IconBranch,
  IconClose,
  IconMaximize,
  IconMinimize,
  IconPlus,
  IconSearch,
  NavIcons,
  TrailLogo,
} from "./design/TrailIcons";

export type TrailShellProps = {
  workspaces: WorkspaceDto[];
  activeWorkspace: WorkspaceDto | undefined;
  activeWorkspaceId: string | null;
  platform: string;
  onSwitchWorkspace: (id: string) => void;
  onSyncNow: () => void;
  syncing: boolean;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  github?: WorkspaceGithubSnapshot;
  onGithubDisconnect?: () => void;
  onGithubRefresh?: () => void;
  onShowOnboarding?: () => void;
  boardRefreshKey?: number;
  onIssueCreated?: () => void;
};

const MENU = ["File", "Edit", "View", "Go", "Agents", "Help"] as const;

export type { ShellView };

const VIEWS = [
  { id: "dashboard" as const, label: "Dashboard", icon: NavIcons.dashboard },
  { id: "board" as const, label: "Board", icon: NavIcons.board },
  { id: "roadmap" as const, label: "Roadmap", icon: NavIcons.roadmap },
  { id: "decisions" as const, label: "Decisions", icon: NavIcons.decisions },
  { id: "docs" as const, label: "Docs", icon: NavIcons.docs },
  { id: "designs" as const, label: "Designs", icon: NavIcons.designs },
  { id: "settings" as const, label: "Settings", icon: NavIcons.settings, bottom: true },
] as const;

const tabBtnStyle: CSSProperties = {
  width: 22,
  height: 22,
  border: 0,
  borderRadius: 6,
  background: "transparent",
  color: "var(--ink-faint)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export function TrailShell({
  workspaces,
  activeWorkspace,
  activeWorkspaceId,
  platform,
  onSwitchWorkspace,
  onSyncNow,
  syncing,
  syncError,
  lastSyncedAt,
  github,
  onGithubDisconnect,
  onGithubRefresh,
  onShowOnboarding,
  boardRefreshKey = 0,
  onIssueCreated,
}: TrailShellProps) {
  const [centerView, setCenterView] = useState<CenterView>("dashboard");
  const [worktreeTabOpen, setWorktreeTabOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [issueDetail, setIssueDetail] = useState<IssueDetail | null>(null);
  const fixture = getDashboardFixture(activeWorkspace);
  const modKey = platform === "darwin" ? "Cmd" : "Ctrl";
  const wsIndex = workspaces.findIndex((w) => w.id === activeWorkspaceId);
  const onWorktreeSidebar = shellShowsWorktreeSidebar(centerView);
  const onInspector = shellShowsInspector(centerView);
  const onComposer = shellShowsComposer(centerView);

  const openWorktree = () => {
    setWorktreeTabOpen(true);
    setCenterView("worktree");
  };

  const openIssue = (issue: string, title: string) => {
    setIssueDetail(getIssueDetailByRef(issue, title));
  };

  const closeIssue = () => setIssueDetail(null);

  const openWorktreeFromIssue = () => {
    closeIssue();
    openWorktree();
  };

  const handlePalettePick = (item: PaletteItem) => {
    setPaletteOpen(false);
    setPaletteQuery("");
    const t = item.target;
    if (t.type === "view") {
      setCenterView(t.view);
    } else if (t.type === "worktree") {
      openWorktree();
    } else if (t.type === "sync") {
      onSyncNow();
    } else if (t.type === "new-task") {
      setNewTaskOpen(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="trail-app"
      style={
        {
          position: "relative",
          "--focus-ring": `0 0 0 2px #0b0d10, 0 0 0 4px var(--accent)`,
        } as CSSProperties
      }
    >
      <header
        className="titlebar-drag"
        style={{
          flex: "0 0 36px",
          display: "flex",
          alignItems: "center",
          background: "var(--surface)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="titlebar-drag"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
            width: 72,
          }}
        >
          <TrailLogo />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>Trail</span>
        </div>
        <nav
          aria-label="Application menu"
          className="titlebar-no-drag"
          style={{ display: "flex", gap: 2 }}
        >
          {MENU.map((item) => (
            <button
              key={item}
              type="button"
              style={{
                height: 24,
                padding: "0 8px",
                border: 0,
                borderRadius: 6,
                background: "transparent",
                color: "var(--ink-muted)",
                font: "inherit",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <div
          className="titlebar-drag"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            minWidth: 0,
            minHeight: 36,
          }}
        >
          <button
            type="button"
            className="titlebar-no-drag"
            onClick={() => {
              setPaletteOpen(true);
              setPaletteQuery("");
            }}
            data-tip={`Search (${modKey} K)`}
            data-tip-pos="below"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              maxWidth: 420,
              height: 26,
              padding: "0 8px 0 10px",
              border: "1px solid var(--line-strong)",
              borderRadius: 8,
              background: "var(--surface-raised)",
              color: "var(--ink-muted)",
              font: "inherit",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <IconSearch />
            <span>Search tasks, decisions and docs</span>
            <kbd className="tr-kbd" style={{ marginLeft: "auto" }}>
              {modKey} K
            </kbd>
          </button>
        </div>
        {platform !== "darwin" ? (
          <div className="titlebar-no-drag" style={{ display: "flex", height: 36 }}>
            <WinBtn label="Minimize" onClick={() => void window.trail?.minimize?.()}>
              <IconMinimize />
            </WinBtn>
            <WinBtn label="Maximize" onClick={() => void window.trail?.maximize?.()}>
              <IconMaximize />
            </WinBtn>
            <WinBtn label="Close window" onClick={() => void window.trail?.close?.()}>
              <IconClose />
            </WinBtn>
          </div>
        ) : null}
      </header>

      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex" }}>
        <nav
          aria-label="Workspaces"
          style={{
            flex: "0 0 56px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "10px 0",
            background: "var(--bg)",
            borderRight: "1px solid var(--line)",
          }}
        >
          {workspaces.map((ws, index) => {
            const active = ws.id === activeWorkspaceId;
            return (
              <div
                key={ws.id}
                style={{ position: "relative", width: 56, display: "flex", justifyContent: "center" }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    width: 3,
                    height: 20,
                    borderRadius: "0 3px 3px 0",
                    background: ws.accent,
                    opacity: active ? 1 : 0,
                  }}
                  aria-hidden
                />
                <button
                  type="button"
                  className="titlebar-no-drag"
                  aria-label={`${ws.name} workspace, ${workspaceShortcut(index, platform)}`}
                  aria-pressed={active}
                  data-tip={ws.name}
                  data-tip-pos="right"
                  onClick={() => onSwitchWorkspace(ws.id)}
                  style={{
                    width: 36,
                    height: 36,
                    padding: 0,
                    borderRadius: 10,
                    font: "inherit",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: ws.accentSoft,
                    color: ws.accent,
                    border: `1px solid ${active ? ws.accent : ws.accentLine}`,
                  }}
                >
                  {ws.shortLabel}
                </button>
              </div>
            );
          })}
          <button
            type="button"
            aria-label="Add workspace"
            data-tip="Add workspace"
            data-tip-pos="right"
            disabled
            className="titlebar-no-drag"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              borderRadius: 10,
              border: "1px dashed var(--line-strong)",
              background: "transparent",
              color: "var(--ink-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "not-allowed",
            }}
          >
            <IconPlus />
          </button>
          <button
            type="button"
            aria-label="Joey de Kruis, local workspace"
            data-tip="Joey de Kruis · Local workspace"
            data-tip-pos="right"
            disabled
            className="titlebar-no-drag"
            style={{
              marginTop: "auto",
              width: 36,
              height: 36,
              padding: 0,
              border: 0,
              borderRadius: 10,
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrailAvatar initials="JK" name="Joey de Kruis" tone="mint" />
          </button>
        </nav>

        <nav
          aria-label="Views"
          style={{
            flex: "0 0 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "8px 0",
            background: "var(--surface)",
            borderRight: "1px solid var(--line)",
          }}
        >
          {VIEWS.filter((v) => !("bottom" in v && v.bottom)).map((view) => {
            const active = isShellViewCenter(centerView) && centerView === view.id;
            return (
              <button
                key={view.id}
                type="button"
                aria-label={view.label}
                data-tip={view.label}
                data-tip-pos="right"
                aria-current={active ? "page" : undefined}
                onClick={() => setCenterView(view.id)}
                style={{
                  width: 36,
                  height: 36,
                  padding: 0,
                  border: 0,
                  borderRadius: 8,
                  background: active ? "var(--surface-hover)" : "transparent",
                  color: active ? "var(--accent)" : "var(--ink-muted)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {view.icon}
              </button>
            );
          })}
          <button
            type="button"
            aria-label="Settings"
            data-tip="Settings"
            data-tip-pos="right"
            aria-current={centerView === "settings" ? "page" : undefined}
            onClick={() => setCenterView("settings")}
            style={{
              marginTop: "auto",
              width: 36,
              height: 36,
              padding: 0,
              border: 0,
              borderRadius: 8,
              background: centerView === "settings" ? "var(--surface-hover)" : "transparent",
              color: centerView === "settings" ? "var(--accent)" : "var(--ink-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {NavIcons.settings}
          </button>
        </nav>

        {onWorktreeSidebar ? (
        <aside
          aria-label="Projects"
          style={{
            flex: "0 0 256px",
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            borderRight: "1px solid var(--line)",
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: "0 0 36px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--accent)" }} />
            <span style={{ fontWeight: 600 }}>{activeWorkspace?.name ?? "Trail"}</span>
            <kbd className="tr-kbd" style={{ marginLeft: "auto" }}>
              {wsIndex >= 0 ? workspaceShortcut(wsIndex, platform) : fixture.wsKey}
            </kbd>
          </div>
          <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
            <SidebarSection
              title="Worktrees"
              count={fixture.nLocal}
              rows={fixture.local}
              onOpenWorktree={openWorktree}
              onOpenIssue={openIssue}
            />
            <SidebarSection
              title="Remote worktrees"
              count={fixture.nRemote}
              rows={fixture.remote}
              topPad={16}
              onOpenWorktree={openWorktree}
              onOpenIssue={openIssue}
            />
          </div>
          <a
            href="#board"
            onClick={(e) => {
              e.preventDefault();
              setCenterView("board");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "0 8px 8px",
              padding: "7px 10px",
              border: "1px solid var(--line-strong)",
              borderRadius: 8,
              background: "var(--surface-raised)",
              textDecoration: "none",
              color: "var(--ink-soft)",
              fontSize: 12,
              lineHeight: "16px",
            }}
          >
            <span className="tr-dot" style={{ color: "var(--mint)" }} />
            <span>Autopilot on</span>
            <span className="tr-faint">{fixture.tool}</span>
            <span className="tr-mono tr-faint" style={{ marginLeft: "auto" }}>
              {fixture.apCount}
            </span>
          </a>
        </aside>
        ) : null}

        <section
          aria-label="Workspace"
          style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}
        >
          <TabBar
            centerView={centerView}
            worktreeTabOpen={worktreeTabOpen}
            onSelectView={setCenterView}
            onOpenWorktree={openWorktree}
            onCloseWorktreeTab={() => {
              setWorktreeTabOpen(false);
              if (centerView === "worktree") setCenterView("dashboard");
            }}
          />
          <ShellMain
            centerView={centerView}
            setCenterView={setCenterView}
            fixture={fixture}
            activeWorkspace={activeWorkspace}
            onSyncNow={onSyncNow}
            syncing={syncing}
            lastSyncedAt={lastSyncedAt}
            boardRefreshKey={boardRefreshKey}
            github={github}
            onGithubDisconnect={onGithubDisconnect}
            onGithubRefresh={onGithubRefresh}
            onNewTask={() => setNewTaskOpen(true)}
            modKey={modKey}
            onOpenWorktree={openWorktree}
            onShowOnboarding={onShowOnboarding}
            onOpenIssue={openIssue}
          />
          {onComposer ? <TrailComposer modKey={modKey} maxWidth={shellContentMaxWidth("dashboard")} /> : null}
        </section>

        {onInspector ? (
        <aside
          aria-label="Inspector"
          style={{
            flex: "0 0 304px",
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            borderLeft: "1px solid var(--line)",
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: "0 0 36px",
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="tr-overline">Inspector</span>
          </div>
          <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto" }}>
            <InspectorSections onOpenIssue={openIssue} />
          </div>
        </aside>
        ) : null}
      </div>

      <footer
        style={{
          flex: "0 0 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "0 12px",
          background: "var(--surface)",
          borderTop: "1px solid var(--line)",
          fontSize: 11,
          lineHeight: "16px",
          color: "var(--ink-muted)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <IconBranch />
          <span className="tr-mono" style={{ fontSize: 11 }}>
            {activeWorkspace?.integrationBranch ?? "development"}
          </span>
        </span>
        <SyncStatus
          state={syncError ? "conflict" : syncing ? "syncing" : "synced"}
          label={syncing ? "Syncing…" : syncError ?? formatSyncLabel(lastSyncedAt)}
        />
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="tr-dot" style={{ color: "var(--mint)" }} />
          {fixture.runText}
        </span>
        <span>{fixture.tool}</span>
        <span>{github?.connected ? `GitHub · @${github.login ?? "connected"}` : "GitHub not connected"}</span>
      </footer>
      <CommandPalette
        open={paletteOpen}
        query={paletteQuery}
        onQueryChange={setPaletteQuery}
        onClose={() => setPaletteOpen(false)}
        onPick={handlePalettePick}
      />
      <NewTaskModal
        open={newTaskOpen}
        workspace={activeWorkspace}
        modKey={modKey}
        onClose={() => setNewTaskOpen(false)}
        onCreated={onIssueCreated}
      />
      <IssueDetailModal
        open={issueDetail !== null}
        detail={issueDetail}
        modKey={modKey}
        onClose={closeIssue}
        onOpenWorktree={openWorktreeFromIssue}
      />
    </div>
  );
}

function WinBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-tip={label}
      data-tip-pos="below-end"
      onClick={onClick}
      style={{
        width: 46,
        height: 36,
        border: 0,
        background: "transparent",
        color: "var(--ink-muted)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function SidebarSection({
  title,
  count,
  rows,
  topPad = 14,
  onOpenWorktree,
  onOpenIssue,
}: {
  title: string;
  count: number;
  rows: { title: string; sub: string; dot: import("./design/fixture").WtDot }[];
  topPad?: number;
  onOpenWorktree?: () => void;
  onOpenIssue?: (issue: string, title: string) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${topPad}px 14px 6px 16px`,
        }}
      >
        <span className="tr-overline">
          {title}{" "}
          <span className="tr-mono tr-faint" style={{ marginLeft: 4 }}>
            {count}
          </span>
        </span>
        {title === "Worktrees" ? (
          <button
            type="button"
            aria-label="New worktree"
            data-tip="New worktree"
            data-tip-pos="below"
            style={{
              width: 24,
              height: 24,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: "var(--ink-muted)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <IconPlus size={14} />
          </button>
        ) : null}
      </div>
      <nav aria-label={title} style={{ padding: "0 8px 12px", display: "flex", flexDirection: "column", gap: 1 }}>
        {rows.map((row) => (
          <a
            key={row.title}
            href="#worktree"
            onClick={(e) => {
              e.preventDefault();
              if (!row.title.startsWith("#")) {
                return;
              }
              const parsed = parseIssueTitleLine(row.title);
              if (e.shiftKey && parsed) {
                onOpenIssue?.(parsed.issue, parsed.title);
                return;
              }
              onOpenWorktree?.();
            }}
            title={row.title.startsWith("#") ? "Open worktree · Shift+click for issue details" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 8px",
              borderRadius: 6,
              textDecoration: "none",
              background: row.dot === "running" ? "var(--surface-hover)" : "transparent",
              color: row.dot === "running" ? "var(--ink)" : "var(--ink-muted)",
            }}
          >
            <span className="tr-dot" style={{ color: dotColor(row.dot), flex: "0 0 auto" }} />
            <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  lineHeight: "18px",
                }}
              >
                {row.title}
              </span>
              <span
                className="tr-mono tr-faint"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                  lineHeight: "14px",
                }}
              >
                {row.sub}
              </span>
            </span>
          </a>
        ))}
      </nav>
    </>
  );
}

function ShellMain({
  centerView,
  setCenterView,
  fixture,
  activeWorkspace,
  onSyncNow,
  syncing,
  lastSyncedAt,
  boardRefreshKey,
  github,
  onGithubDisconnect,
  onGithubRefresh,
  onNewTask,
  modKey,
  onOpenWorktree,
  onShowOnboarding,
  onOpenIssue,
}: {
  centerView: CenterView;
  setCenterView: (view: CenterView) => void;
  fixture: ReturnType<typeof getDashboardFixture>;
  activeWorkspace: WorkspaceDto | undefined;
  onSyncNow: () => void;
  syncing: boolean;
  lastSyncedAt?: string | null;
  boardRefreshKey: number;
  github?: WorkspaceGithubSnapshot;
  onGithubDisconnect?: () => void;
  onGithubRefresh?: () => void;
  onNewTask: () => void;
  modKey: string;
  onOpenWorktree: () => void;
  onShowOnboarding?: () => void;
  onOpenIssue: (issue: string, title: string) => void;
}) {
  if (centerView === "worktree") {
    return (
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <WorktreeView onOpenIssue={onOpenIssue} />
      </div>
    );
  }
  if (centerView === "board") {
    return (
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <BoardView
          workspace={activeWorkspace}
          onSyncNow={onSyncNow}
          syncing={syncing}
          boardRefreshKey={boardRefreshKey}
          onNewTask={onNewTask}
          modKey={modKey}
          onOpenWorktree={onOpenWorktree}
        />
      </div>
    );
  }
  if (centerView === "designs") {
    return (
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DesignsView />
      </div>
    );
  }
  if (centerView === "settings") {
    return (
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SettingsView
          workspace={activeWorkspace}
          github={github}
          onGithubDisconnect={onGithubDisconnect}
          onGithubRefresh={onGithubRefresh}
          onShowOnboarding={onShowOnboarding}
          onSyncNow={onSyncNow}
          syncing={syncing}
          lastSyncedAt={lastSyncedAt}
        />
      </div>
    );
  }
  if (shellUsesScrollCanvas(centerView)) {
    const maxWidth = shellContentMaxWidth(centerView);
    return (
      <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", padding: "20px 24px" }}>
        <div
          style={{
            width: "100%",
            maxWidth,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {centerView === "dashboard" ? (
            <DashboardMain
              fixture={fixture}
              onSyncNow={onSyncNow}
              syncing={syncing}
              onNewTask={onNewTask}
              onOpenIssue={onOpenIssue}
            />
          ) : null}
          {centerView === "roadmap" ? (
            <RoadmapView workspace={activeWorkspace} onGoToBoard={setCenterView} />
          ) : null}
          {centerView === "decisions" ? (
            <DecisionsView workspace={activeWorkspace} onOpenIssue={onOpenIssue} />
          ) : null}
          {centerView === "docs" ? (
            <DocsView workspace={activeWorkspace} onSyncNow={onSyncNow} syncing={syncing} />
          ) : null}
        </div>
      </div>
    );
  }
  return null;
}

function TabBar({
  centerView,
  worktreeTabOpen,
  onSelectView,
  onOpenWorktree,
  onCloseWorktreeTab,
}: {
  centerView: CenterView;
  worktreeTabOpen: boolean;
  onSelectView: (view: CenterView) => void;
  onOpenWorktree: () => void;
  onCloseWorktreeTab: () => void;
}) {
  const dashActive = centerView === "dashboard";
  const worktreeActive = centerView === "worktree";
  const pageLabel = isShellViewCenter(centerView) ? SHELL_VIEW_LABELS[centerView] : "";
  const pageTabActive = isShellViewCenter(centerView) && centerView !== "dashboard";
  const tabShell = (active: boolean): CSSProperties =>
    active
      ? { background: "var(--bg)", boxShadow: "inset 0 2px 0 var(--accent)" }
      : {};

  return (
    <div
      role="tablist"
      aria-label="Open views"
      style={{
        flex: "0 0 36px",
        display: "flex",
        alignItems: "stretch",
        background: "var(--surface)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 6px 0 14px",
          borderRight: "1px solid var(--line)",
          ...tabShell(dashActive),
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={dashActive}
          onClick={() => onSelectView("dashboard")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 34,
            padding: 0,
            border: 0,
            background: "transparent",
            color: dashActive ? "var(--ink)" : "var(--ink-muted)",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
        <button type="button" aria-label="Close Dashboard" data-tip="Close Dashboard" data-tip-pos="below" style={tabBtnStyle}>
          <IconClose />
        </button>
      </div>
      {worktreeTabOpen ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 6px 0 14px",
            borderRight: "1px solid var(--line)",
            ...tabShell(worktreeActive),
          }}
        >
          <span className="tr-dot" style={{ color: "var(--mint)" }} />
          <button
            type="button"
            role="tab"
            aria-selected={worktreeActive}
            onClick={onOpenWorktree}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 34,
              paddingLeft: 4,
              border: 0,
              background: "transparent",
              color: worktreeActive ? "var(--ink)" : "var(--ink-muted)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            #42 Fix redirect
          </button>
          <button
            type="button"
            aria-label="Close #42 Fix redirect"
            data-tip="Close #42 Fix redirect"
            data-tip-pos="below"
            onClick={onCloseWorktreeTab}
            style={tabBtnStyle}
          >
            <IconClose />
          </button>
        </div>
      ) : null}
      {pageTabActive ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 6px 0 14px",
            borderRight: "1px solid var(--line)",
            ...tabShell(pageTabActive),
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={pageTabActive}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 34,
              padding: 0,
              border: 0,
              background: "transparent",
              color: "var(--ink)",
              fontSize: 13,
              cursor: "default",
            }}
          >
            {pageLabel}
          </button>
          <button
            type="button"
            aria-label={`Close ${pageLabel}`}
            data-tip={`Close ${pageLabel}`}
            data-tip-pos="below"
            onClick={() => onSelectView("dashboard")}
            style={tabBtnStyle}
          >
            <IconClose />
          </button>
        </div>
      ) : centerView === "dashboard" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 14px", borderRight: "1px solid var(--line)" }}>
          <button
            type="button"
            role="tab"
            onClick={() => onSelectView("board")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 34,
              padding: 0,
              border: 0,
              background: "transparent",
              color: "var(--ink-muted)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Board
          </button>
        </div>
      ) : null}
      <button
        type="button"
        aria-label="New tab"
        data-tip="New tab"
        data-tip-pos="below"
        style={{
          width: 36,
          height: 36,
          border: 0,
          background: "transparent",
          color: "var(--ink-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <IconPlus />
      </button>
    </div>
  );
}

function DashboardMain({
  fixture,
  onSyncNow,
  syncing,
  onNewTask,
  onOpenIssue,
}: {
  fixture: ReturnType<typeof getDashboardFixture>;
  onSyncNow: () => void;
  syncing: boolean;
  onNewTask: () => void;
  onOpenIssue: (issue: string, title: string) => void;
}) {
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Dashboard
          </h1>
          <span className="tr-small">
            {fixture.repo} · development
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TrailButton variant="secondary" disabled={syncing} onClick={onSyncNow}>
            {syncing ? "Syncing…" : "Sync now"}
          </TrailButton>
          <TrailButton variant="primary" onClick={onNewTask}>
            New task
          </TrailButton>
        </div>
      </div>
      <ConflictBanner action="Resolve">
        Issue #37 was closed on GitHub, but the task is still In progress in Trail.
      </ConflictBanner>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <TrailStatTile label="Open tasks" value="24" note="6 added this week" />
        <TrailStatTile label="Running now" value="1" note="Limit is 2 at once" tone="mint" />
        <TrailStatTile label="In review" value="2" note="Draft pull requests" tone="violet" />
        <TrailStatTile label="Decisions" value="12" note="1 proposed" tone="blue" />
      </div>
      <TrailPanel title="Worktrees" flush>
        {fixture.panelRows.map((row, i) => (
          <button
            key={row.issue}
            type="button"
            onClick={() => onOpenIssue(row.issue, row.title)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              padding: "10px 14px",
              border: 0,
              borderBottom: i < fixture.panelRows.length - 1 ? "1px solid var(--line-soft)" : undefined,
              background: "transparent",
              color: "inherit",
              font: "inherit",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <TrailAvatar initials={row.agentInitials} name={row.agentName} tone={row.agentTone} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontWeight: 500 }}>
                <span className="tr-mono tr-faint">{row.issue}</span> {row.title}
              </span>
              <span className="tr-mono tr-faint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.output}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <TrailChip tone={row.chipTone}>{row.chip}</TrailChip>
              <span className="tr-mono tr-faint">{row.duration}</span>
            </div>
          </button>
        ))}
      </TrailPanel>
    </>
  );
}

function InspectorSections({ onOpenIssue }: { onOpenIssue: (issue: string, title: string) => void }) {
  return (
    <>
      <div style={{ padding: "14px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="tr-overline">Needs your review</span>
        <span className="tr-count">1</span>
      </div>
      <div style={{ padding: "0 14px 8px" }}>
        <KanbanCard
          issue="#38"
          title="Export decisions to Markdown"
          labels={[{ text: "feature", tone: "blue" }]}
          adr="ADR-011"
          pr="PR #51 draft"
          prTone="violet"
          agentInitials="CL"
          onClick={() => onOpenIssue("#38", "Export decisions to Markdown")}
        />
      </div>
      <div
        style={{
          padding: "14px 14px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--line-soft)",
          marginTop: 8,
        }}
      >
        <span className="tr-overline">Decisions</span>
        <span className="tr-count">12</span>
      </div>
      <DecisionRow
        id="ADR-012"
        title="Run agents in separate git worktrees"
        status="Proposed"
        meta="Claude · today"
      />
      <DecisionRow
        id="ADR-011"
        title="Use GitHub issues as the task store"
        status="Accepted"
        meta="You · 2 days ago"
      />
      <div style={{ padding: "14px 14px 6px", borderTop: "1px solid var(--line-soft)" }}>
        <span className="tr-overline">Activity</span>
      </div>
      <ActivityItem
        initials="CU"
        tone="blue"
        who="Cursor"
        did="opened a draft pull request"
        what="#51 Export decisions to Markdown"
        when="6 min ago"
        onOpenWhat={() => onOpenIssue("#51", "Export decisions to Markdown")}
      />
      <ActivityItem
        initials="GH"
        tone="violet"
        who="GitHub"
        did="closed an issue"
        what="#37 Sync board columns with Projects"
        when="3 hours ago"
        onOpenWhat={() => onOpenIssue("#37", "Sync board columns with Projects")}
      />
      <ActivityItem
        initials="JK"
        tone="mint"
        who="You"
        did="accepted a decision"
        what="ADR-011 Use GitHub issues as the task store"
        when="2 days ago"
      />
    </>
  );
}
