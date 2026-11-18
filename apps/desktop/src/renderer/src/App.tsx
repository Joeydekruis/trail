import { useCallback, useEffect, useState } from "react";
import type { WorkspaceDto } from "@trail/ipc";
import { OnboardingPlaceholder } from "./OnboardingPlaceholder";
import { applyWorkspaceAccent } from "./workspace-accent";

declare global {
  interface Window {
    trail?: {
      platform: string;
      listWorkspaces: () => Promise<{
        workspaces: WorkspaceDto[];
        activeWorkspaceId: string;
      }>;
      switchWorkspace: (workspaceId: string) => Promise<{
        active: WorkspaceDto;
        workspaces: WorkspaceDto[];
      }>;
      syncNow: (workspaceId?: string) => Promise<void>;
    };
  }
}

type AppView = "dashboard" | "onboarding";

const NAV_ITEMS = ["Dashboard", "Board", "Decisions", "Docs", "Designs"] as const;

export function App() {
  const platform = window.trail?.platform ?? "unknown";
  const [view, setView] = useState<AppView>("dashboard");
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyActive = useCallback((active: WorkspaceDto) => {
    setActiveWorkspaceId(active.id);
    applyWorkspaceAccent(active);
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const api = window.trail;
      if (!api) {
        return;
      }
      const result = await api.switchWorkspace(workspaceId);
      setWorkspaces(result.workspaces);
      applyActive(result.active);
    },
    [applyActive],
  );

  useEffect(() => {
    const api = window.trail;
    if (!api) {
      setLoadError("Preload bridge unavailable");
      return;
    }
    void api
      .listWorkspaces()
      .then((data) => {
        setWorkspaces(data.workspaces);
        const active =
          data.workspaces.find((w) => w.id === data.activeWorkspaceId) ??
          data.workspaces[0];
        if (active) {
          applyActive(active);
        }
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load workspaces");
      });
  }, [applyActive]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      const index = Number.parseInt(event.key, 10);
      if (index < 1 || index > 9) {
        return;
      }
      const target = workspaces[index - 1];
      if (!target || target.id === activeWorkspaceId) {
        return;
      }
      event.preventDefault();
      void switchWorkspace(target.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [workspaces, activeWorkspaceId, switchWorkspace]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <div className="shell">
      <header className="titlebar">
        <div className="titlebar-start">
          <span className="logo">Trail</span>
          <nav className="titlebar-tabs" aria-label="Views">
            {NAV_ITEMS.map((item) => (
              <span key={item} className="titlebar-tab titlebar-tab--disabled">
                {item}
              </span>
            ))}
          </nav>
        </div>
        <span className="titlebar-meta">
          {activeWorkspace?.name ?? "—"} · {platform} · cache-first
        </span>
      </header>

      <div className="shell-body">
        {view === "onboarding" ? (
          <div className="shell-main shell-main--solo">
            <OnboardingPlaceholder />
          </div>
        ) : (
          <>
            <aside className="workspace-strip" aria-label="Workspaces">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  className={
                    ws.id === activeWorkspaceId
                      ? "workspace-chip workspace-chip--active"
                      : "workspace-chip"
                  }
                  title={ws.name}
                  aria-label={`Switch to ${ws.name}`}
                  aria-current={ws.id === activeWorkspaceId ? "true" : undefined}
                  onClick={() => void switchWorkspace(ws.id)}
                >
                  {ws.shortLabel}
                </button>
              ))}
              <button
                type="button"
                className="workspace-add"
                disabled
                aria-label="Add workspace"
              >
                +
              </button>
            </aside>
            <nav className="view-rail" aria-label="Sections">
              <span className="view-rail-item view-rail-item--active">Overview</span>
              <span className="view-rail-item">Activity</span>
              <span className="view-rail-item">Runs</span>
            </nav>
            <main className="shell-main">
              <div className="dashboard-placeholder">
                <h1>Dashboard</h1>
                {loadError ? (
                  <p className="dashboard-error">{loadError}</p>
                ) : (
                  <p>
                    Workspaces load from local SQLite on startup (
                    {workspaces.length} cached). GitHub sync starts after first paint.
                    Use <kbd>Cmd</kbd>+<kbd>1</kbd>–<kbd>3</kbd> to switch.
                  </p>
                )}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setView("onboarding")}
                >
                  Preview onboarding placeholder
                </button>
              </div>
            </main>
          </>
        )}
      </div>

      <footer className="statusbar">
        <span className="statusbar-item">
          <span className="status-dot status-dot--idle" aria-hidden />
          GitHub — not connected
        </span>
        <span className="statusbar-item">
          Workspace — {activeWorkspace?.name ?? "loading…"}
        </span>
        <button
          type="button"
          className="statusbar-link"
          onClick={() =>
            setView(view === "onboarding" ? "dashboard" : "onboarding")
          }
        >
          {view === "onboarding" ? "Back to dashboard" : "Onboarding"}
        </button>
      </footer>
    </div>
  );
}