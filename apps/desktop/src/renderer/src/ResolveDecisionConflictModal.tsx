import { useEffect, useState, type CSSProperties } from "react";
import type {
  DecisionContentConflictDto,
  DecisionDetailDto,
  DecisionResolveContentConflictPayload,
} from "@trail/ipc";
import { IconClose } from "./design/TrailIcons";
import { TrailButton, TrailChip } from "./design/TrailUi";

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
  width: "min(960px, 100%)",
  maxHeight: "min(90vh, 720px)",
  overflow: "auto",
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "18px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

type Resolution = DecisionResolveContentConflictPayload["resolution"];

type ResolveDecisionConflictModalProps = {
  open: boolean;
  workspaceId: string;
  conflict: DecisionContentConflictDto | null;
  onClose: () => void;
  onResolved: () => void;
};

function AdrCompareColumn({ detail }: { detail: DecisionDetailDto | null }) {
  if (!detail) {
    return <p className="tr-small">Loading…</p>;
  }
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 12,
        background: "var(--surface-card)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span className="tr-mono" style={{ fontWeight: 600 }}>
          {detail.adrId}
        </span>
        <TrailChip tone="mint">{detail.status}</TrailChip>
      </div>
      <p style={{ margin: "0 0 10px", fontWeight: 500 }}>{detail.title}</p>
      {(
        [
          ["Context", detail.contextMarkdown],
          ["Decision", detail.decisionMarkdown],
        ] as const
      ).map(([label, text]) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div className="tr-overline">{label}</div>
          <p style={{ margin: "6px 0 0", color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>{text}</p>
        </div>
      ))}
    </div>
  );
}

export function ResolveDecisionConflictModal({
  open,
  workspaceId,
  conflict,
  onClose,
  onResolved,
}: ResolveDecisionConflictModalProps) {
  const [detailA, setDetailA] = useState<DecisionDetailDto | null>(null);
  const [detailB, setDetailB] = useState<DecisionDetailDto | null>(null);
  const [resolution, setResolution] = useState<Resolution>("keep_b_supersede_a");
  const [scopeNote, setScopeNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !conflict) {
      setDetailA(null);
      setDetailB(null);
      return;
    }
    const api = window.trail;
    if (!api?.getDecision) {
      return;
    }
    void Promise.all([
      api.getDecision({ workspaceId, adrId: conflict.adrIdA }),
      api.getDecision({ workspaceId, adrId: conflict.adrIdB }),
    ]).then(([a, b]) => {
      setDetailA(a.ok ? a.decision : null);
      setDetailB(b.ok ? b.decision : null);
    });
    setResolution("keep_b_supersede_a");
    setScopeNote("");
    setError(null);
  }, [open, conflict, workspaceId]);

  if (!open || !conflict) {
    return null;
  }

  const resolve = async () => {
    const api = window.trail;
    if (!api?.resolveDecisionContentConflict || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await api.resolveDecisionContentConflict({
        workspaceId,
        adrIdA: conflict.adrIdA,
        adrIdB: conflict.adrIdB,
        resolution,
        scopeNote: resolution === "keep_both" ? scopeNote : undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onResolved();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlay} role="dialog" aria-modal aria-labelledby="resolve-decision-conflict-title">
      <div style={panel}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="resolve-decision-conflict-title" style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
              Resolve decision conflict
            </h2>
            <p className="tr-small" style={{ margin: "6px 0 0" }}>
              {conflict.summary}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            data-tip="Close"
            data-tip-pos="below"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              color: "var(--ink-muted)",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <IconClose />
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <AdrCompareColumn detail={detailA} />
          <AdrCompareColumn detail={detailB} />
        </div>

        <WhatThisChangesPanel detailA={detailA} detailB={detailB} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="tr-overline">Resolution</span>
          <ResolutionOptions conflict={conflict} resolution={resolution} onPick={setResolution} />
          {resolution === "keep_both" ? (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="tr-small">Scope note (where each ADR applies)</span>
              <textarea
                value={scopeNote}
                onChange={(e) => setScopeNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: "var(--surface-raised)",
                  color: "inherit",
                  padding: 10,
                  font: "inherit",
                  resize: "vertical",
                }}
              />
            </label>
          ) : null}
        </div>

        {error ? (
          <p className="tr-small" style={{ margin: 0, color: "var(--red)" }}>
            {error}
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <TrailButton variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </TrailButton>
          <TrailButton variant="primary" onClick={() => void resolve()} disabled={busy}>
            {busy ? "Saving…" : "Resolve and save"}
          </TrailButton>
        </div>
      </div>
    </div>
  );
}

function WhatThisChangesPanel({
  detailA,
  detailB,
}: {
  detailA: DecisionDetailDto | null;
  detailB: DecisionDetailDto | null;
}) {
  const blocked =
    detailA?.blocksIssueNumber != null
      ? detailA
      : detailB?.blocksIssueNumber != null
        ? detailB
        : null;
  if (!blocked?.blocksIssueNumber) {
    return null;
  }
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: 12,
        background: "var(--amber-soft)",
      }}
    >
      <div className="tr-overline">What this changes</div>
      <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>
        Issue #{blocked.blocksIssueNumber}
        {blocked.blockedIssueTitle ? ` · ${blocked.blockedIssueTitle}` : ""} is waiting on a
        decision before work can continue.
      </p>
    </div>
  );
}

function ResolutionOptions({
  conflict,
  resolution,
  onPick,
}: {
  conflict: DecisionContentConflictDto;
  resolution: Resolution;
  onPick: (value: Resolution) => void;
}) {
  const options: Array<{ id: Resolution; label: string }> = [
    {
      id: "keep_a_supersede_b",
      label: `Keep ${conflict.adrIdA} · supersede ${conflict.adrIdB}`,
    },
    {
      id: "keep_b_supersede_a",
      label: `Keep ${conflict.adrIdB} · supersede ${conflict.adrIdA}`,
    },
    { id: "keep_both", label: "Keep both with scope note" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((option) => (
        <label
          key={option.id}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <input
            type="radio"
            name="decision-conflict-resolution"
            checked={resolution === option.id}
            onChange={() => onPick(option.id)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}