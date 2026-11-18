import { useState } from "react";
import type { WorkspaceDto } from "@trail/ipc";
import { getDecisionDetail, getDecisionsFixture } from "./design/decisions-fixture";
import { ViewPageHeader } from "./design/ViewPageHeader";
import {
  ConflictBanner,
  DecisionRow,
  FilterPill,
  SyncStatus,
  TrailButton,
  TrailChip,
  TrailPanel,
} from "./design/TrailUi";

export function DecisionsView({
  workspace,
  onOpenIssue,
}: {
  workspace: WorkspaceDto | undefined;
  onOpenIssue?: (issue: string, title: string) => void;
}) {
  const fixture = getDecisionsFixture(workspace);
  const [selectedId, setSelectedId] = useState(fixture.defaultDetail.id);
  const detail = getDecisionDetail(selectedId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ViewPageHeader
        title="Decisions"
        subtitle={`${fixture.repo} · ${fixture.total} decisions`}
        actions={
          <>
            <TrailButton variant="secondary">Export to Markdown</TrailButton>
            <TrailButton variant="primary">New decision</TrailButton>
          </>
        }
      />
      <ConflictBanner action="Compare">{fixture.conflictMessage}</ConflictBanner>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <FilterPill label="All" count={12} active />
        <FilterPill label="Accepted" count={7} />
        <FilterPill label="Proposed" count={1} />
        <FilterPill label="Superseded" count={3} />
        <FilterPill label="Rejected" count={1} />
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
          {fixture.rows.map((row) => (
            <div
              key={row.id}
              style={{
                borderBottom: "1px solid var(--line-soft)",
                background: selectedId === row.id ? "var(--surface-hover)" : undefined,
                cursor: "pointer",
              }}
              onClick={() => setSelectedId(row.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedId(row.id);
              }}
              role="button"
              tabIndex={0}
            >
              <DecisionRow
                id={row.id}
                title={row.title}
                status={row.status}
                meta={row.meta}
                conflict={row.conflict}
                selected={selectedId === row.id}
              />
            </div>
          ))}
          <div style={{ padding: "10px 14px" }}>
            <span className="tr-small">5 more decisions</span>
          </div>
        </TrailPanel>
        <TrailPanel title={`${detail.id} · ${detail.title}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrailChip tone={detail.statusTone}>{detail.status}</TrailChip>
              <SyncStatus state="pending" label={detail.syncLabel} />
              <span className="tr-small" style={{ marginLeft: "auto" }}>
                {detail.authorWhen}
              </span>
            </div>
            {(
              [
                ["Context", detail.context],
                ["Decision", detail.decision],
                ["Consequences", detail.consequences],
              ] as const
            ).map(([label, text]) => (
              <div key={label}>
                <div className="tr-overline">{label}</div>
                <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>{text}</p>
              </div>
            ))}
            <div>
              <div className="tr-overline">Affects</div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {detail.affects.map((a) => (
                  <button
                    key={a.issue}
                    type="button"
                    onClick={() => onOpenIssue?.(a.issue, a.title)}
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
                    <span className="tr-dot" style={{ color: `var(--${a.tone})` }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="tr-mono tr-faint">{a.issue}</span> {a.title}
                    </span>
                    <TrailChip tone={a.chipTone}>{a.chip}</TrailChip>
                  </button>
                ))}
                <span className="tr-small">
                  Accepting resumes #44 from where it paused. Rejecting stops it and asks the agent how to proceed
                  without this decision. Other worktrees keep running.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <TrailButton variant="primary">Accept decision</TrailButton>
              <TrailButton variant="secondary">Reject</TrailButton>
            </div>
          </div>
        </TrailPanel>
      </div>
    </div>
  );
}