import { useCallback, useEffect, useMemo, useState } from "react";
import type { DecisionDetailDto, DecisionSummaryDto, WorkspaceDto } from "@trail/ipc";
import { downloadMarkdownFile } from "./download-markdown";
import { NewDecisionModal } from "./NewDecisionModal";
import { ViewPageHeader } from "./design/ViewPageHeader";
import {
  DecisionRow,
  FilterPill,
  SyncStatus,
  TrailButton,
  TrailChip,
  TrailPanel,
} from "./design/TrailUi";

function statusLabel(status: DecisionSummaryDto["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(
  status: DecisionSummaryDto["status"],
): "blue" | "mint" | "gray" | "amber" {
  switch (status) {
    case "proposed":
      return "blue";
    case "accepted":
      return "mint";
    case "rejected":
      return "gray";
    case "superseded":
      return "gray";
    default:
      return "gray";
  }
}

function formatMeta(author: string, updatedAt: string): string {
  const day = updatedAt.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return `${author} · ${day === today ? "today" : day}`;
}

export function DecisionsView({
  workspace,
  onOpenIssue,
}: {
  workspace: WorkspaceDto | undefined;
  onOpenIssue?: (issue: string, title: string) => void;
}) {
  const [rows, setRows] = useState<DecisionSummaryDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DecisionDetailDto | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const reloadList = useCallback(async () => {
    const api = window.trail;
    if (!api?.listDecisions || !workspace?.id) {
      return;
    }
    const result = await api.listDecisions(workspace.id);
    setRows(result.decisions);
    setSelectedId((current) => {
      if (current && result.decisions.some((row) => row.adrId === current)) {
        return current;
      }
      const proposed = result.decisions.find((row) => row.status === "proposed");
      return proposed?.adrId ?? result.decisions[0]?.adrId ?? null;
    });
  }, [workspace?.id]);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    const api = window.trail;
    if (!api?.getDecision || !workspace?.id || !selectedId) {
      setDetail(null);
      return;
    }
    void api.getDecision({ workspaceId: workspace.id, adrId: selectedId }).then((result) => {
      if (result.ok) {
        setDetail(result.decision);
      }
    });
  }, [workspace?.id, selectedId]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: rows.length,
      accepted: 0,
      proposed: 0,
      superseded: 0,
      rejected: 0,
    };
    for (const row of rows) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const repoLabel = workspace?.repository ?? workspace?.name ?? "Workspace";

  async function handleAccept() {
    const api = window.trail;
    if (!api?.acceptDecision || !workspace?.id || !selectedId || accepting) {
      return;
    }
    setAccepting(true);
    try {
      const result = await api.acceptDecision({ workspaceId: workspace.id, adrId: selectedId });
      if (result.ok) {
        setDetail(result.decision);
        await reloadList();
      }
    } finally {
      setAccepting(false);
    }
  }

  async function handleExport() {
    const api = window.trail;
    if (!api?.exportDecisionMarkdown || !workspace?.id || exporting) {
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const result = await api.exportDecisionMarkdown({
        workspaceId: workspace.id,
        adrId: selectedId ?? undefined,
      });
      if (!result.ok) {
        setExportError(result.message);
        return;
      }
      downloadMarkdownFile(result.filename, result.markdown);
    } finally {
      setExporting(false);
    }
  }

  async function handleReject() {
    const api = window.trail;
    if (!api?.rejectDecision || !workspace?.id || !selectedId || rejecting) {
      return;
    }
    setRejecting(true);
    try {
      const result = await api.rejectDecision({ workspaceId: workspace.id, adrId: selectedId });
      if (result.ok) {
        setDetail(result.decision);
        await reloadList();
      }
    } finally {
      setRejecting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ViewPageHeader
        title="Decisions"
        subtitle={`${repoLabel} · ${rows.length} decisions`}
        actions={
          <>
            <TrailButton
              variant="secondary"
              disabled={exporting || rows.length === 0}
              onClick={() => void handleExport()}
            >
              {exporting ? "Exporting…" : "Export to Markdown"}
            </TrailButton>
            <TrailButton variant="primary" onClick={() => setNewOpen(true)}>
              New decision
            </TrailButton>
          </>
        }
      />
      {exportError ? (
        <p className="tr-small" style={{ margin: 0, color: "var(--red)" }}>
          {exportError}
        </p>
      ) : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <FilterPill label="All" count={statusCounts.all} active />
        <FilterPill label="Accepted" count={statusCounts.accepted} />
        <FilterPill label="Proposed" count={statusCounts.proposed} />
        <FilterPill label="Superseded" count={statusCounts.superseded} />
        <FilterPill label="Rejected" count={statusCounts.rejected} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 5fr) minmax(0, 6fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <TrailPanel title="All decisions" flush>
          {rows.map((row) => (
            <div
              key={row.adrId}
              style={{
                borderBottom: "1px solid var(--line-soft)",
                background: selectedId === row.adrId ? "var(--surface-hover)" : undefined,
                cursor: "pointer",
              }}
              onClick={() => setSelectedId(row.adrId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedId(row.adrId);
              }}
              role="button"
              tabIndex={0}
            >
              <DecisionRow
                id={row.adrId}
                title={row.title}
                status={statusLabel(row.status)}
                meta={formatMeta(row.author, row.updatedAt)}
                conflict={row.blocksIssueNumber != null}
                selected={selectedId === row.adrId}
              />
            </div>
          ))}
        </TrailPanel>
        {detail ? (
          <TrailPanel title={`${detail.adrId} · ${detail.title}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrailChip tone={statusTone(detail.status)}>{statusLabel(detail.status)}</TrailChip>
                <SyncStatus state="pending" label="Not yet in GitHub" />
                <span className="tr-small" style={{ marginLeft: "auto" }}>
                  {formatMeta(detail.author, detail.updatedAt)}
                </span>
              </div>
              {(
                [
                  ["Context", detail.contextMarkdown],
                  ["Decision", detail.decisionMarkdown],
                  ["Consequences", detail.consequencesMarkdown],
                ] as const
              ).map(([label, text]) => (
                <div key={label}>
                  <div className="tr-overline">{label}</div>
                  <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>{text}</p>
                </div>
              ))}
              {detail.blocksIssueNumber != null ? (
                <div>
                  <div className="tr-overline">Affects</div>
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenIssue?.(
                          `#${detail.blocksIssueNumber}`,
                          detail.blockedIssueTitle ?? "Blocked issue",
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "8px 10px",
                        border: "1px solid var(--line)",
                        borderRadius: 8,
                        background: "var(--surface-card)",
                        color: "inherit",
                        font: "inherit",
                        textAlign: "left",
                        cursor: onOpenIssue ? "pointer" : "default",
                      }}
                    >
                      <span className="tr-dot" style={{ color: "var(--amber)" }} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="tr-mono tr-faint">#{detail.blocksIssueNumber}</span>{" "}
                        {detail.blockedIssueTitle ?? "Waiting for this decision"}
                      </span>
                      <TrailChip tone="amber">Waiting for decision</TrailChip>
                    </button>
                  </div>
                </div>
              ) : null}
              {detail.status === "proposed" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <TrailButton variant="primary" onClick={() => void handleAccept()} disabled={accepting}>
                    {accepting ? "Accepting…" : "Accept decision"}
                  </TrailButton>
                  <TrailButton
                    variant="secondary"
                    onClick={() => void handleReject()}
                    disabled={rejecting}
                  >
                    {rejecting ? "Rejecting…" : "Reject"}
                  </TrailButton>
                </div>
              ) : null}
            </div>
          </TrailPanel>
        ) : (
          <TrailPanel title="Select a decision">
            <p className="tr-small" style={{ margin: 0 }}>
              No decisions loaded yet.
            </p>
          </TrailPanel>
        )}
      </div>
      <NewDecisionModal
        open={newOpen}
        workspace={workspace}
        onClose={() => setNewOpen(false)}
        onCreated={(adrId) => {
          setSelectedId(adrId);
          void reloadList();
        }}
      />
    </div>
  );
}