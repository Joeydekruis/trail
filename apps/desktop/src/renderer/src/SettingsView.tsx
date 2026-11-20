import { useEffect, useState, type ReactNode } from "react";
import type { WorkspaceDto, WorkspaceGithubSnapshot } from "@trail/ipc";
import { DEFAULT_PROJECT_STATUS_FIELD, DEFAULT_SYNC_INTERVAL_SEC, formatWorkspaceRepoLine } from "@trail/core";
import { TrailButton, TrailSelect, trailFieldStyle } from "./design/TrailUi";
import { formatSyncLabel } from "./sync-label";

const PROJECT_STATUS_FIELD_PRESETS = [
  DEFAULT_PROJECT_STATUS_FIELD,
  "State",
  "Column",
] as const;

const SYNC_INTERVAL_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 30, label: "Every 30 seconds" },
  { value: DEFAULT_SYNC_INTERVAL_SEC, label: "Every 60 seconds" },
  { value: 120, label: "Every 2 minutes" },
  { value: 300, label: "Every 5 minutes" },
] as const;

function SettingsBlock({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        paddingTop: 16,
        borderTop: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{title}</h3>
        {lead ? (
          <p className="tr-small" style={{ margin: "6px 0 0" }}>
            {lead}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "github", label: "GitHub" },
  { id: "agents", label: "Agents and autopilot" },
  { id: "mcp", label: "MCP" },
  { id: "docs", label: "Docs and designs" },
  { id: "notes", label: "Notifications" },
] as const;

type SettingsSection = (typeof SECTIONS)[number]["id"];

export function SettingsView({
  workspace,
  github,
  onGithubDisconnect,
  onGithubRefresh,
  onShowOnboarding,
  onSyncNow,
  syncing,
  lastSyncedAt,
}: {
  workspace: WorkspaceDto | undefined;
  github?: WorkspaceGithubSnapshot;
  onGithubDisconnect?: () => void;
  onGithubRefresh?: () => void;
  onShowOnboarding?: () => void;
  onSyncNow?: () => void;
  syncing?: boolean;
  lastSyncedAt?: string | null;
}) {
  const [section, setSection] = useState<SettingsSection>("general");
  const [pat, setPat] = useState("");
  const [patBusy, setPatBusy] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);
  const [statusField, setStatusField] = useState<string>(DEFAULT_PROJECT_STATUS_FIELD);
  const [statusFieldBusy, setStatusFieldBusy] = useState(false);
  const [statusFieldSaved, setStatusFieldSaved] = useState(false);
  const [syncIntervalSec, setSyncIntervalSec] = useState<number>(DEFAULT_SYNC_INTERVAL_SEC);
  const [syncIntervalBusy, setSyncIntervalBusy] = useState(false);
  const name = workspace?.name ?? "Trail";
  const repoLine = workspace
    ? formatWorkspaceRepoLine({
        repository: workspace.repository,
        integrationBranch: workspace.integrationBranch,
      })
    : "No repo linked";

  useEffect(() => {
    const api = window.trail;
    if (section !== "github" || !workspace?.id || !api?.getGithubBoardMapping) {
      return;
    }
    void api.getGithubBoardMapping(workspace.id).then((result) => {
      setStatusField(result.projectStatusField);
      setSyncIntervalSec(result.syncIntervalSec);
    });
  }, [section, workspace?.id]);

  const syncIntervalLabel =
    SYNC_INTERVAL_OPTIONS.find((opt) => opt.value === syncIntervalSec)?.label ??
    SYNC_INTERVAL_OPTIONS[2].label;

  const statusFieldOptions = PROJECT_STATUS_FIELD_PRESETS.includes(
    statusField as (typeof PROJECT_STATUS_FIELD_PRESETS)[number],
  )
    ? [...PROJECT_STATUS_FIELD_PRESETS]
    : [...PROJECT_STATUS_FIELD_PRESETS, statusField];

  async function saveSyncInterval(nextSec: number) {
    const api = window.trail;
    if (!api?.setGithubBoardMapping || !workspace?.id || syncIntervalBusy) {
      return;
    }
    setSyncIntervalBusy(true);
    try {
      const result = await api.setGithubBoardMapping({
        workspaceId: workspace.id,
        syncIntervalSec: nextSec,
      });
      setSyncIntervalSec(result.syncIntervalSec);
    } finally {
      setSyncIntervalBusy(false);
    }
  }

  async function saveStatusField(next: string) {
    const api = window.trail;
    if (!api?.setGithubBoardMapping || !workspace?.id || statusFieldBusy) {
      return;
    }
    setStatusFieldBusy(true);
    setStatusFieldSaved(false);
    try {
      const result = await api.setGithubBoardMapping({
        workspaceId: workspace.id,
        projectStatusField: next,
      });
      setStatusField(result.projectStatusField);
      setStatusFieldSaved(true);
    } finally {
      setStatusFieldBusy(false);
    }
  }

  async function reconnectWithPat() {
    const api = window.trail;
    if (!api?.githubSetToken || patBusy) {
      return;
    }
    setPatBusy(true);
    setPatError(null);
    try {
      const result = await api.githubSetToken(pat);
      if (!result.ok) {
        setPatError(result.message);
        return;
      }
      setPat("");
      onGithubRefresh?.();
    } finally {
      setPatBusy(false);
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
      <nav
        aria-label="Settings"
        style={{
          flex: "0 0 216px",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRight: "1px solid var(--line)",
          background: "var(--surface)",
        }}
      >
        <span className="tr-overline" style={{ padding: "0 8px 8px" }}>
          Workspace settings
        </span>
        {SECTIONS.map((s) => {
          const on = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => setSection(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                height: 30,
                padding: "0 10px",
                border: 0,
                borderRadius: 6,
                background: on ? "var(--surface-hover)" : "transparent",
                color: on ? "var(--ink)" : "var(--ink-soft)",
                font: "inherit",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          );
        })}
      </nav>
      <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 40px" }}>
          {section === "general" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>General</h2>
                <p className="tr-small" style={{ marginTop: 6 }}>
                  Workspace name and linked GitHub repository.
                </p>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 400 }}>
                <span style={{ fontWeight: 500 }}>Workspace name</span>
                <input
                  type="text"
                  readOnly
                  value={name}
                  style={{
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--ink)",
                    font: "inherit",
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 400 }}>
                <span style={{ fontWeight: 500 }}>GitHub repository</span>
                <input
                  type="text"
                  readOnly
                  value={repoLine}
                  style={{
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--ink-muted)",
                    font: "inherit",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 400 }}>
                <span style={{ fontWeight: 500 }}>Integration branch</span>
                <input
                  type="text"
                  readOnly
                  value={workspace?.integrationBranch ?? "development"}
                  style={{
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--ink)",
                    font: "inherit",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 400 }}>
                <span style={{ fontWeight: 500 }}>Production branch</span>
                <input
                  type="text"
                  readOnly
                  value={workspace?.productionBranch ?? "main"}
                  style={{
                    height: 34,
                    padding: "0 10px",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--ink)",
                    font: "inherit",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                  }}
                />
              </label>
              {onShowOnboarding ? (
                <SettingsBlock title="Workspaces">
                  <p className="tr-small" style={{ margin: 0 }}>
                    Connect another GitHub repository as a workspace.
                  </p>
                  <TrailButton variant="secondary" onClick={onShowOnboarding}>
                    Add workspace…
                  </TrailButton>
                </SettingsBlock>
              ) : null}
            </div>
          ) : section === "github" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SettingsBlock
                title="GitHub connection"
                lead="Trail uses a personal access token with repo scope (OAuth coming later)."
              >
                {github?.connected ? (
                  <p className="tr-small" style={{ margin: 0 }}>
                    Connected as <span className="tr-mono">@{github.login ?? "unknown"}</span>
                  </p>
                ) : (
                  <p className="tr-small" style={{ margin: 0 }}>
                    Not connected. Add a token or run setup.
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {onGithubDisconnect && github?.connected ? (
                    <TrailButton variant="secondary" onClick={onGithubDisconnect}>
                      Disconnect
                    </TrailButton>
                  ) : null}
                  {onShowOnboarding ? (
                    <TrailButton variant="secondary" onClick={onShowOnboarding}>
                      Run setup wizard…
                    </TrailButton>
                  ) : null}
                </div>
              </SettingsBlock>
              <SettingsBlock title="Personal access token">
                <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
                  <span className="tr-small">Paste a new token to connect or rotate credentials</span>
                  <input
                    type="password"
                    value={pat}
                    onChange={(event) => setPat(event.target.value)}
                    autoComplete="off"
                    className="trail-secret-input"
                    style={trailFieldStyle}
                  />
                  {patError ? (
                    <span className="tr-small" style={{ color: "var(--warning)" }}>
                      {patError}
                    </span>
                  ) : null}
                  <span>
                    <TrailButton
                      variant="primary"
                      disabled={patBusy || pat.trim() === ""}
                      onClick={() => void reconnectWithPat()}
                    >
                      {patBusy ? "Saving…" : "Save token"}
                    </TrailButton>
                  </span>
                </label>
              </SettingsBlock>
              <SettingsBlock
                title="Board mapping"
                lead="Single-select field on GitHub Projects v2 that drives kanban columns during sync and drag."
              >
                <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
                  <span style={{ fontWeight: 500 }}>Projects status field</span>
                  <TrailSelect
                    aria-label="Projects status field"
                    value={statusField}
                    options={[...statusFieldOptions]}
                    disabled={statusFieldBusy || !workspace?.repository}
                    onChange={(value) => {
                      setStatusField(value);
                      void saveStatusField(value);
                    }}
                  />
                  {!workspace?.repository ? (
                    <span className="tr-small">Link a repository to configure board mapping.</span>
                  ) : statusFieldSaved ? (
                    <span className="tr-small">Saved. Run Sync now on the board to refresh columns.</span>
                  ) : (
                    <span className="tr-small">
                      Options should match your project (e.g. Backlog, Todo, In progress).
                    </span>
                  )}
                </label>
              </SettingsBlock>
              <SettingsBlock
                title="Background sync"
                lead="Keeps the board cache fresh while Trail is open. Manual Sync now always works."
              >
                <p className="tr-small tr-mono" style={{ margin: 0 }}>
                  {syncing ? "Syncing…" : formatSyncLabel(lastSyncedAt)}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {onSyncNow ? (
                    <TrailButton
                      variant="secondary"
                      disabled={syncing || !workspace?.repository || !github?.connected}
                      onClick={onSyncNow}
                    >
                      {syncing ? "Syncing…" : "Sync now"}
                    </TrailButton>
                  ) : null}
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
                  <span style={{ fontWeight: 500 }}>Sync interval</span>
                  <TrailSelect
                    aria-label="Sync interval"
                    value={syncIntervalLabel}
                    options={SYNC_INTERVAL_OPTIONS.map((opt) => opt.label)}
                    disabled={syncIntervalBusy || !workspace?.repository}
                    onChange={(label) => {
                      const match = SYNC_INTERVAL_OPTIONS.find((opt) => opt.label === label);
                      if (!match) {
                        return;
                      }
                      setSyncIntervalSec(match.value);
                      void saveSyncInterval(match.value);
                    }}
                  />
                </label>
              </SettingsBlock>
            </div>
          ) : (
            <p className="tr-small" style={{ paddingTop: 8 }}>
              {SECTIONS.find((s) => s.id === section)?.label} — mock UI only in this batch.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}