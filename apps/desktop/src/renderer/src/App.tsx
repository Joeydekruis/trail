declare global {
  interface Window {
    trail?: {
      platform: string;
      syncNow: (workspaceId?: string) => Promise<void>;
    };
  }
}

export function App() {
  const platform = window.trail?.platform ?? "unknown";

  return (
    <div className="shell">
      <header className="titlebar">
        <span className="logo">Trail</span>
        <span className="titlebar-meta">
          Desktop shell · {platform} · design ref in repo
        </span>
      </header>
      <main className="placeholder">
        <h1>Dashboard</h1>
        <p>
          Electron foundation is in place. Next: app chrome (workspace strip,
          view rail, tabs) per{" "}
          <code>design/desktop-dashboard/v1.html</code>.
        </p>
      </main>
    </div>
  );
}