import { useEffect, useState, type CSSProperties } from "react";
import type { WorkspaceDto } from "@trail/ipc";
import { IconClose } from "./design/TrailIcons";
import { TrailButton } from "./design/TrailUi";

const fieldLabel: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "var(--surface-card)",
  color: "inherit",
  font: "inherit",
  boxSizing: "border-box",
};

const textAreaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 88,
  resize: "vertical",
  lineHeight: 1.45,
};

type NewDecisionModalProps = {
  open: boolean;
  workspace: WorkspaceDto | undefined;
  onClose: () => void;
  onCreated?: (adrId: string) => void;
};

export function NewDecisionModal({
  open,
  workspace,
  onClose,
  onCreated,
}: NewDecisionModalProps) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [decision, setDecision] = useState("");
  const [consequences, setConsequences] = useState("");
  const [blockIssue, setBlockIssue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setTitle("");
    setContext("");
    setDecision("");
    setConsequences("");
    setBlockIssue("");
    setError(null);
    setBusy(false);
  }, [open]);

  if (!open) {
    return null;
  }

  async function submit() {
    const api = window.trail;
    if (!api?.createDecision || !workspace?.id || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    const blocksRaw = blockIssue.trim();
    const blocksIssueNumber = blocksRaw ? Number.parseInt(blocksRaw, 10) : undefined;
    if (blocksRaw && (!blocksIssueNumber || blocksIssueNumber < 1)) {
      setError("Issue number must be a positive integer.");
      setBusy(false);
      return;
    }
    try {
      const result = await api.createDecision({
        workspaceId: workspace.id,
        title: title.trim(),
        contextMarkdown: context.trim(),
        decisionMarkdown: decision.trim(),
        consequencesMarkdown: consequences.trim() || undefined,
        blocksIssueNumber,
        status: "proposed",
      });
      if (!result.ok) {
        setError(
          result.existingAdrId
            ? `${result.message} (${result.existingAdrId})`
            : result.message,
        );
        return;
      }
      onCreated?.(result.decision.adrId);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    title.trim().length > 0 && context.trim().length > 0 && decision.trim().length > 0;

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
        aria-label="New decision"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "min(90vh, 720px)",
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
          <h2 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 600 }}>New decision</h2>
          <button
            type="button"
            aria-label="Close"
            data-tip="Close"
            data-tip-pos="below"
            onClick={onClose}
            style={{
              display: "inline-flex",
              padding: 6,
              border: "none",
              borderRadius: 8,
              background: "transparent",
              color: "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <label style={fieldLabel}>
            <span className="tr-overline">Title</span>
            <input
              style={inputStyle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are we deciding?"
              autoFocus
            />
          </label>
          <label style={fieldLabel}>
            <span className="tr-overline">Context</span>
            <textarea
              style={textAreaStyle}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Why does this decision matter now?"
            />
          </label>
          <label style={fieldLabel}>
            <span className="tr-overline">Decision</span>
            <textarea
              style={textAreaStyle}
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="What did we choose?"
            />
          </label>
          <label style={fieldLabel}>
            <span className="tr-overline">Consequences (optional)</span>
            <textarea
              style={textAreaStyle}
              value={consequences}
              onChange={(e) => setConsequences(e.target.value)}
              placeholder="What follows from this?"
            />
          </label>
          <label style={fieldLabel}>
            <span className="tr-overline">Block issue # until accepted (optional)</span>
            <input
              style={inputStyle}
              value={blockIssue}
              onChange={(e) => setBlockIssue(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 44"
              inputMode="numeric"
            />
          </label>
          {error ? (
            <p className="tr-small" style={{ margin: 0, color: "var(--red)" }}>
              {error}
            </p>
          ) : (
            <p className="tr-small" style={{ margin: 0, color: "var(--ink-muted)" }}>
              Saved as Proposed in Trail (SQLite). Agents can read it via MCP.
            </p>
          )}
        </div>
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 20px",
            borderTop: "1px solid var(--line)",
          }}
        >
          <TrailButton variant="secondary" onClick={onClose} type="button">
            Cancel
          </TrailButton>
          <TrailButton
            variant="primary"
            type="button"
            disabled={!canSubmit || busy}
            onClick={() => void submit()}
          >
            {busy ? "Saving…" : "Create decision"}
          </TrailButton>
        </div>
      </div>
    </div>
  );
}