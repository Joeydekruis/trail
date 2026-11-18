import { useEffect, useState, type CSSProperties } from "react";
import type { WorkspaceDto } from "@trail/ipc";
import { IconClose } from "./design/TrailIcons";
import { SelectButton, TrailButton, TrailChip } from "./design/TrailUi";

type NewTaskModalProps = {
  open: boolean;
  workspace: WorkspaceDto | undefined;
  modKey: string;
  onClose: () => void;
};

type Mode = "chat" | "form";

const TYPE_OPTIONS = [
  { id: "feature", label: "Feature", dot: "var(--blue)", on: true },
  { id: "bug", label: "Bug", dot: "var(--mint)", on: false },
  { id: "chore", label: "Chore", dot: "var(--ink-muted)", on: false },
  { id: "docs", label: "Docs", dot: "var(--violet)", on: false },
];

const PRIO_OPTIONS = [
  { id: "low", label: "Low", dot: "var(--ink-muted)", on: false },
  { id: "medium", label: "Medium", dot: "var(--blue)", on: true },
  { id: "high", label: "High", dot: "var(--amber)", on: false },
];

export function NewTaskModal({ open, workspace, modKey, onClose }: NewTaskModalProps) {
  const [mode, setMode] = useState<Mode>("chat");
  const [readyForAgent, setReadyForAgent] = useState(true);
  const [startWorktree, setStartWorktree] = useState(false);
  const repo = workspace?.id ?? "trail";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 55,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        boxSizing: "border-box",
        background: "rgba(5, 7, 10, 0.62)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        role="dialog"
        aria-label="New task"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 720,
          height: "min(720px, 100%)",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, lineHeight: "22px", fontWeight: 600 }}>New task</h2>
          <span style={{ display: "inline-flex", gap: 6 }}>
            <TrailButton
              variant="secondary"
              onClick={() => setMode("chat")}
              type="button"
            >
              <span style={{ fontWeight: mode === "chat" ? 600 : 400 }}>Create with chat</span>
            </TrailButton>
            <TrailButton variant="secondary" onClick={() => setMode("form")} type="button">
              <span style={{ fontWeight: mode === "form" ? 600 : 400 }}>Fill in manually</span>
            </TrailButton>
          </span>
          <span className="tr-small" style={{ marginLeft: "auto" }}>
            {repo} · creates a GitHub issue
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              flex: "0 0 auto",
              width: 28,
              height: 28,
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
            <IconClose />
          </button>
        </div>

        {mode === "chat" ? (
          <ChatMode modKey={modKey} onEditManually={() => setMode("form")} />
        ) : (
          <FormMode
            modKey={modKey}
            readyForAgent={readyForAgent}
            startWorktree={startWorktree}
            onReadyChange={setReadyForAgent}
            onStartChange={setStartWorktree}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}

function ChatMode({ modKey, onEditManually }: { modKey: string; onEditManually: () => void }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="tr-small">Trail</span>
          <div
            style={{
              padding: "10px 12px",
              border: "1px solid var(--line)",
              borderRadius: 10,
              background: "var(--surface-raised)",
              color: "var(--ink-soft)",
            }}
          >
            Describe what you want in your own words. I turn it into an issue with a title, acceptance
            criteria, labels and a priority. You approve the draft before anything is created on GitHub.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <span className="tr-small">You</span>
          <div
            style={{
              maxWidth: "88%",
              padding: "10px 12px",
              border: "1px solid var(--line-strong)",
              borderRadius: 10,
              background: "var(--surface-card)",
              color: "var(--ink-soft)",
            }}
          >
            Add a retry button when sync fails on a card, single-issue sync only.
          </div>
        </div>
        <DraftIssueCard onEditManually={onEditManually} />
      </div>
      <div style={{ flex: "0 0 auto", padding: "10px 14px 14px", borderTop: "1px solid var(--line)" }}>
        <div
          className="composer"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "10px 12px",
            background: "var(--surface-raised)",
            border: "1px solid var(--line-strong)",
            borderRadius: 12,
          }}
        >
          <label htmlFor="ntchat" className="tr-sr">
            Describe the task
          </label>
          <textarea
            id="ntchat"
            rows={3}
            readOnly
            placeholder="Describe the task, a bug you saw, or paste a link. Type # to refer to an issue"
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "none",
              border: 0,
              outline: 0,
              background: "transparent",
              color: "var(--ink)",
              font: "inherit",
              lineHeight: "20px",
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <SelectButton label="You" />
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <kbd className="tr-kbd">{modKey} Enter</kbd>
              <TrailButton variant="primary">Send</TrailButton>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DraftIssueCard({ onEditManually }: { onEditManually: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "14px 14px 14px 17px",
        background: "var(--surface-card)",
        border: "1px solid var(--accent-line)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--accent)",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="tr-overline">Draft issue</span>
        <span className="tr-small" style={{ marginLeft: "auto" }}>
          Not created yet
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: "22px" }}>
        Add a retry button to failed syncs
      </div>
      <div style={{ color: "var(--ink-soft)" }}>
        When a sync fails the card shows a red state but there is no way to try again.
      </div>
      <div>
        <div className="tr-overline">Acceptance criteria</div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, color: "var(--ink-soft)" }}>
          <span>The change works as described above</span>
          <span>Existing behaviour keeps working and has a test</span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <TrailChip tone="blue">feature</TrailChip>
        <TrailChip tone="mint">agent-ready</TrailChip>
        <TrailChip tone="gray">priority:medium</TrailChip>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <TrailButton variant="primary">Create on GitHub</TrailButton>
        <TrailButton variant="secondary">Create and start in a worktree</TrailButton>
        <TrailButton variant="ghost" onClick={onEditManually}>
          Edit manually
        </TrailButton>
      </div>
    </div>
  );
}

function FormMode({
  modKey,
  readyForAgent,
  startWorktree,
  onReadyChange,
  onStartChange,
  onCancel,
}: {
  modKey: string;
  readyForAgent: boolean;
  startWorktree: boolean;
  onReadyChange: (v: boolean) => void;
  onStartChange: (v: boolean) => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 500 }}>Title</span>
          <input
            type="text"
            readOnly
            defaultValue="Add a retry button to failed syncs"
            style={fieldInputStyle}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontWeight: 500 }}>Description</span>
            <span className="tr-small">Markdown. Agents read this as the brief.</span>
          </div>
          <textarea
            readOnly
            rows={6}
            defaultValue={`When a sync fails the card shows a red state but there is no way to try again. Add a Retry action that runs the sync for that issue only.

Done when:
- Retry appears on a failed card
- A successful retry clears the error`}
            style={{ ...fieldInputStyle, minHeight: 132, padding: "8px 10px", lineHeight: "20px" }}
          />
        </label>
        <PillGroup title="Type" options={TYPE_OPTIONS} />
        <PillGroup title="Priority" subtitle="Saved as a label on the issue." options={PRIO_OPTIONS} />
        <AgentToggles
          readyForAgent={readyForAgent}
          startWorktree={startWorktree}
          onReadyChange={onReadyChange}
          onStartChange={onStartChange}
        />
        <span className="tr-small">
          Will create issue with labels <span className="tr-mono">feature, agent-ready, priority:medium</span>
        </span>
      </div>
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 20px",
          borderTop: "1px solid var(--line)",
        }}
      >
        <TrailButton variant="ghost" onClick={onCancel}>
          Cancel
        </TrailButton>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
          <kbd className="tr-kbd">{modKey} Enter</kbd>
          <TrailButton variant="primary">Create issue</TrailButton>
        </span>
      </div>
    </>
  );
}

const fieldInputStyle: CSSProperties = {
  boxSizing: "border-box",
  padding: "0 10px",
  border: "1px solid var(--line-strong)",
  borderRadius: 8,
  background: "var(--bg)",
  color: "var(--ink)",
  font: "inherit",
  outline: 0,
  height: 34,
};

function PillGroup({
  title,
  subtitle,
  options,
}: {
  title: string;
  subtitle?: string;
  options: { id: string; label: string; dot: string; on: boolean }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontWeight: 500 }}>{title}</span>
        {subtitle ? <span className="tr-small">{subtitle}</span> : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={o.on}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 28,
              padding: "0 12px",
              borderRadius: 999,
              border: `1px solid ${o.on ? "var(--accent-line)" : "var(--line-strong)"}`,
              background: o.on ? "var(--accent-soft)" : "var(--surface-card)",
              color: o.on ? "var(--ink)" : "var(--ink-soft)",
              font: "inherit",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: o.dot }} />
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function AgentToggles({
  readyForAgent,
  startWorktree,
  onReadyChange,
  onStartChange,
}: {
  readyForAgent: boolean;
  startWorktree: boolean;
  onReadyChange: (v: boolean) => void;
  onStartChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)", borderRadius: 10, padding: "0 14px" }}>
      <ToggleRow
        title="Ready for an agent"
        note="Adds agent-ready. Autopilot may pick it up once it is in Todo."
        on={readyForAgent}
        onToggle={() => onReadyChange(!readyForAgent)}
        borderBottom
      />
      <ToggleRow
        title="Start in a worktree now"
        note="Puts it in Todo and starts the agent immediately."
        on={startWorktree}
        onToggle={() => onStartChange(!startWorktree)}
      />
    </div>
  );
}

function ToggleRow({
  title,
  note,
  on,
  onToggle,
  borderBottom,
}: {
  title: string;
  note: string;
  on: boolean;
  onToggle: () => void;
  borderBottom?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
        borderBottom: borderBottom ? "1px solid var(--line-soft)" : undefined,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 500 }}>{title}</span>
        <span className="tr-small">{note}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        style={{
          position: "relative",
          flex: "0 0 auto",
          width: 34,
          height: 20,
          padding: 0,
          borderRadius: 999,
          border: `1px solid ${on ? "var(--accent-line)" : "var(--line-strong)"}`,
          background: on ? "var(--accent-soft)" : "var(--surface-card)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: on ? "var(--accent)" : "var(--ink-faint)",
            transition: "left 0.15s ease",
          }}
        />
      </button>
    </div>
  );
}