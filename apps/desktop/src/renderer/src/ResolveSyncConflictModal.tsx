import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { SyncConflictDto } from "@trail/ipc";
import { BOARD_COLUMN_META } from "@trail/core/client";
import { IconClose } from "./design/TrailIcons";
import { TrailButton } from "./design/TrailUi";

type SidePick = "github" | "trail";

type FieldPicks = {
  state: SidePick;
  boardColumn: SidePick;
  labels: SidePick;
};

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 60,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "rgba(0,0,0,0.35)",
};

const panel: CSSProperties = {
  width: "min(720px, 100%)",
  maxHeight: "min(90vh, 640px)",
  overflow: "auto",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

function defaultPicks(conflict: SyncConflictDto): FieldPicks {
  return {
    state: conflict.github.state === conflict.trail.state ? "github" : "github",
    boardColumn:
      conflict.github.boardColumn === conflict.trail.boardColumn ? "github" : "github",
    labels: "github",
  };
}

function formatLabels(labels: string[]): string {
  return labels.length > 0 ? labels.join(", ") : "—";
}

function columnLabel(id: string): string {
  return BOARD_COLUMN_META[id as keyof typeof BOARD_COLUMN_META]?.name ?? id;
}

type ResolveSyncConflictModalProps = {
  open: boolean;
  conflicts: SyncConflictDto[];
  onClose: () => void;
  onResolved: () => void;
};

export function ResolveSyncConflictModal({
  open,
  conflicts,
  onClose,
  onResolved,
}: ResolveSyncConflictModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [picksByIssue, setPicksByIssue] = useState<Record<number, FieldPicks>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conflict = conflicts[selectedIndex] ?? null;

  const picks = useMemo(() => {
    if (!conflict) {
      return null;
    }
    return picksByIssue[conflict.issueNumber] ?? defaultPicks(conflict);
  }, [conflict, picksByIssue]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      return;
    }
    setSelectedIndex(0);
    setPicksByIssue({});
    setBusy(false);
    setError(null);
  }, [open]);

  if (!open || !conflict || !picks) {
    return null;
  }

  const setPick = (field: keyof FieldPicks, side: SidePick) => {
    setPicksByIssue((prev) => ({
      ...prev,
      [conflict.issueNumber]: { ...picks, [field]: side },
    }));
  };

  const submit = async (useGitHubForAll: boolean) => {
    const api = window.trail;
    if (!api?.resolveSyncConflict || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await api.resolveSyncConflict({
      issueNumber: conflict.issueNumber,
      useGitHubForAll,
      picks: useGitHubForAll
        ? undefined
        : {
            state: picks.state,
            boardColumn: picks.boardColumn,
            labels: picks.labels,
          },
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onResolved();
  };

  return (
    <div className="tr-modal-overlay" style={overlay} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-labelledby="resolve-sync-title"
        style={panel}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 id="resolve-sync-title" style={{ margin: "0 0 4px", fontSize: 16 }}>
              Resolve sync conflict
            </h2>
            <p className="tr-small" style={{ margin: 0 }}>
              #{conflict.issueNumber} · {conflict.title}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: 0, background: "transparent" }}>
            <IconClose />
          </button>
        </div>

        {conflicts.length > 1 ? (
          <label className="tr-small" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            Issue
            <select
              value={String(selectedIndex)}
              onChange={(event) => setSelectedIndex(Number.parseInt(event.target.value, 10))}
            >
              {conflicts.map((row, index) => (
                <option key={row.issueNumber} value={String(index)}>
                  #{row.issueNumber} {row.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Field</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>GitHub</th>
              <th style={{ textAlign: "left", padding: "6px 8px" }}>Trail</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["state", "State", conflict.github.state, conflict.trail.state] as const,
                [
                  "boardColumn",
                  "Board column",
                  columnLabel(conflict.github.boardColumn),
                  columnLabel(conflict.trail.boardColumn),
                ] as const,
                [
                  "labels",
                  "Labels",
                  formatLabels(conflict.github.labels),
                  formatLabels(conflict.trail.labels),
                ] as const,
              ] as const
            ).map(([field, label, githubValue, trailValue]) => (
              <tr key={field} style={{ borderTop: "1px solid var(--line-soft)" }}>
                <td style={{ padding: "10px 8px", fontWeight: 500 }}>{label}</td>
                <td style={{ padding: "10px 8px" }}>
                  <label className="tr-small" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <input
                      type="radio"
                      name={`${conflict.issueNumber}-${field}`}
                      checked={picks[field] === "github"}
                      onChange={() => setPick(field, "github")}
                    />
                    <span>
                      {githubValue}
                      <span className="tr-small" style={{ display: "block", color: "var(--ink-muted)" }}>
                        {field === "state"
                          ? conflict.github.updatedAt
                          : field === "boardColumn"
                            ? conflict.github.updatedAt
                            : conflict.github.updatedAt}
                      </span>
                    </span>
                  </label>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <label className="tr-small" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <input
                      type="radio"
                      name={`${conflict.issueNumber}-${field}`}
                      checked={picks[field] === "trail"}
                      onChange={() => setPick(field, "trail")}
                    />
                    <span>
                      {trailValue}
                      <span className="tr-small" style={{ display: "block", color: "var(--ink-muted)" }}>
                        {conflict.trail.updatedAt}
                      </span>
                    </span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="tr-small" style={{ margin: 0, color: "var(--ink-muted)" }}>
          Assignee is not tracked in Trail yet — only state, board column, and labels are synced.
        </p>

        {error ? <p className="tr-conflict-text">{error}</p> : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
          <TrailButton variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </TrailButton>
          <TrailButton variant="secondary" disabled={busy} onClick={() => void submit(true)}>
            Use GitHub for all
          </TrailButton>
          <TrailButton variant="primary" disabled={busy} onClick={() => void submit(false)}>
            {busy ? "Saving…" : "Resolve and save"}
          </TrailButton>
        </div>
      </div>
    </div>
  );
}