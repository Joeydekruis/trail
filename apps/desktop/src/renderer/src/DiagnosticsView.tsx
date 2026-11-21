import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { DiagnosticsGetSnapshotResult } from "@trail/ipc";
import { TrailButton } from "./design/TrailUi";

function formatBytes(bytes: number | null): string {
  if (bytes === null) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMs(ms: number | null): string {
  return ms === null ? "—" : `${ms} ms`;
}

export function DiagnosticsView({
  open,
  onClose,
  openViewCount,
}: {
  open: boolean;
  onClose: () => void;
  openViewCount: number;
}) {
  const [snapshot, setSnapshot] = useState<DiagnosticsGetSnapshotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const api = window.trail;
    if (!api?.getDiagnosticsSnapshot) {
      setError("Diagnostics API unavailable");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDiagnosticsSnapshot({ openViewCount });
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }, [openViewCount]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void refresh();
  }, [open, refresh]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trail-diagnostics-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="titlebar-no-drag"
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "min(80vh, 720px)",
          overflow: "auto",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          padding: "16px 18px 18px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <h2 id="trail-diagnostics-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            Diagnostics
          </h2>
          <span className="tr-small tr-faint">Help → CPU, memory, cache, and startup timings</span>
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
            <TrailButton variant="secondary" disabled={loading} onClick={() => void refresh()}>
              {loading ? "Refreshing…" : "Refresh"}
            </TrailButton>
            <TrailButton variant="secondary" onClick={onClose}>
              Close
            </TrailButton>
          </span>
        </header>

        {error ? <p className="tr-conflict-text">{error}</p> : null}

        {snapshot ? (
          <DiagnosticsTable snapshot={snapshot} />
        ) : (
          !error && <p className="tr-small tr-faint">Loading…</p>
        )}
      </div>
    </div>
  );
}

function DiagnosticsTable({ snapshot }: { snapshot: DiagnosticsGetSnapshotResult }) {
  return (
    <DiagnosticsDataTable
      rows={[
        ["Collected", snapshot.collectedAt],
        ["Cold start", formatMs(snapshot.startup.coldStartMs)],
        ["Window shown", formatMs(
          snapshot.startup.windowShownAt !== null && snapshot.startup.appReadyAt !== null
            ? snapshot.startup.windowShownAt - snapshot.startup.appReadyAt
            : null,
        )],
        ["Last workspace switch", formatMs(snapshot.startup.lastWorkspaceSwitchMs)],
        ["Open views", snapshot.openViewCount !== null ? String(snapshot.openViewCount) : "—"],
        ["Workspaces", String(snapshot.workspacesCount)],
        ["Active workspace", snapshot.activeWorkspaceId],
        ["Open issues (cache)", String(snapshot.openIssueCount)],
        ["SQLite cache", formatBytes(snapshot.sqliteBytes)],
        ["SQLite path", snapshot.sqlitePath ?? "in-memory"],
      ]}
      processes={snapshot.processes}
    />
  );
}

function DiagnosticsDataTable({
  rows,
  processes,
}: {
  rows: [string, string][];
  processes: DiagnosticsGetSnapshotResult["processes"];
}) {
  return (
    <DiagnosticsSection>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td
                style={{
                  padding: "6px 8px 6px 0",
                  color: "var(--ink-muted)",
                  verticalAlign: "top",
                  width: "38%",
                }}
              >
                {label}
              </td>
              <td style={{ padding: "6px 0", fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3 className="tr-overline" style={{ margin: "14px 0 8px" }}>
        Processes
      </h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th className="tr-overline" style={{ textAlign: "left", padding: "4px 8px 4px 0" }}>
              Type
            </th>
            <th className="tr-overline" style={{ textAlign: "right", padding: "4px 8px" }}>
              CPU %
            </th>
            <th className="tr-overline" style={{ textAlign: "right", padding: "4px 0" }}>
              Memory
            </th>
          </tr>
        </thead>
        <tbody>
          {processes.map((row) => (
            <tr key={row.type}>
              <td style={{ padding: "4px 8px 4px 0" }}>{row.type}</td>
              <td style={{ padding: "4px 8px", textAlign: "right" }} className="tr-mono">
                {row.cpu}
              </td>
              <td style={{ padding: "4px 0", textAlign: "right" }} className="tr-mono">
                {row.memoryMb} MB
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DiagnosticsSection>
  );
}

function DiagnosticsSection({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{children}</div>;
}