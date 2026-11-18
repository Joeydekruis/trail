import { useState } from "react";
import { OnboardingPlaceholder } from "./OnboardingPlaceholder";

declare global {
  interface Window {
    trail?: {
      platform: string;
      syncNow: (workspaceId?: string) => Promise<void>;
    };
  }
}

type AppView = "dashboard" | "onboarding";

const NAV_ITEMS = ["Dashboard", "Board", "Decisions", "Docs", "Designs"] as const;

export function App() {
  const platform = window.trail?.platform ?? "unknown";
  const [view, setView] = useState<AppView>("dashboard");

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
        <span className="titlebar-meta">Shell · {platform} · fase 0</span>
      </header>

      <div className="shell-body">
        {view === "onboarding" ? (
          <div className="shell-main shell-main--solo">
            <OnboardingPlaceholder />
          </div>
        ) : (
          <>
            <aside className="workspace-strip" aria-label="Workspaces">
              <div className="workspace-chip workspace-chip--active" title="Example">
                ex
              </div>
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
                <p>
                  App chrome skeleton per{" "}
                  <code>design/desktop-dashboard/v1.html</code>. Board, sync, and
                  agents land in later phases.
                </p>
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
        <span className="statusbar-item">Sync — idle</span>
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