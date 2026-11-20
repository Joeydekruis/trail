import { useEffect, useMemo, useState } from "react";
import type { BoardSnapshotResult } from "@trail/ipc";
import type { WorkspaceDto } from "@trail/ipc";
import {
  getBoardFixture,
  type BoardCard,
  type BoardColumn,
  type BoardListGroup,
  type BoardListRow,
} from "./design/board-fixture";
import { getIssueDetail, type IssueDetail } from "./design/issue-detail-fixture";
import { FilterPill, IssueKanbanCard, SelectButton, SyncStatus, TrailButton } from "./design/TrailUi";
import { IssueDetailModal } from "./IssueDetailModal";

type BoardViewProps = {
  workspace: WorkspaceDto | undefined;
  onSyncNow: () => void;
  syncing: boolean;
  onNewTask: () => void;
  modKey: string;
  onOpenWorktree: () => void;
};

export function BoardView({ workspace, onSyncNow, syncing, onNewTask, modKey, onOpenWorktree }: BoardViewProps) {
  const fixture = getBoardFixture(workspace);
  const [boardMode, setBoardMode] = useState(true);
  const [autopilot, setAutopilot] = useState(true);
  const [issueDetail, setIssueDetail] = useState<IssueDetail | null>(null);
  const [liveBoard, setLiveBoard] = useState<BoardSnapshotResult | null>(null);

  useEffect(() => {
    const api = window.trail;
    if (!api?.getBoardSnapshot) {
      return;
    }
    void api.getBoardSnapshot(workspace?.id).then(setLiveBoard);
  }, [workspace?.id, syncing]);

  const boardData = useMemo(() => {
    if (liveBoard?.source === "cache") {
      const listGroups: BoardListGroup[] = liveBoard.columns.map((column) => ({
        name: column.name,
        tone: column.tone,
        count: column.count,
        rows: column.cards.map((card) => ({
          issue: card.issue,
          title: card.title,
          adr: "—",
          pr: "—",
          syncLabel: "Synced",
          by: "—",
        })),
      }));
      return {
        repo: liveBoard.repository ?? workspace?.repository ?? fixture.repo,
        milestone: "GitHub",
        openCount: liveBoard.openCount,
        columns: liveBoard.columns as BoardColumn[],
        listGroups,
      };
    }
    return fixture;
  }, [fixture, liveBoard, workspace?.repository]);

  const openIssue = (card: BoardCard) => {
    const match = /^#(\d+)$/.exec(card.issue);
    const issueNumber = match ? Number.parseInt(match[1], 10) : NaN;
    const api = window.trail;
    if (api?.getIssueDetail && workspace?.repository && !Number.isNaN(issueNumber)) {
      void api.getIssueDetail({ workspaceId: workspace.id, issueNumber }).then((result) => {
        if (result.found) {
          setIssueDetail(result.detail as IssueDetail);
          return;
        }
        setIssueDetail(getIssueDetail(card));
      });
      return;
    }
    setIssueDetail(getIssueDetail(card));
  };
  const closeIssue = () => setIssueDetail(null);
  const handleOpenWorktree = () => {
    closeIssue();
    onOpenWorktree();
  };

  return (
    <>
      <div
        style={{
          flex: "0 0 auto",
          width: "100%",
          maxWidth: "calc(1424px + 48px)",
          margin: "0 auto",
          padding: "20px 24px 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            Board
          </h1>
          <span className="tr-small">
            {boardData.repo} · {boardData.milestone} · {boardData.openCount} open issues
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TrailButton variant="secondary" disabled={syncing} onClick={onSyncNow}>
            {syncing ? "Syncing…" : "Sync now"}
          </TrailButton>
          <TrailButton variant="primary" onClick={onNewTask}>
            New task
          </TrailButton>
        </div>
      </div>

      <div
        style={{
          flex: "0 0 auto",
          width: "100%",
          maxWidth: "calc(1424px + 48px)",
          margin: "0 auto",
          padding: "14px 24px 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
        }}
      >
        <FilterPill label="All" count={12} active />
        <FilterPill label="Agent-ready" count={4} />
        <FilterPill label="Needs review" count={2} />
        <span style={{ marginLeft: 8 }}>
          <SelectButton label={`Milestone ${fixture.milestone}`} />
        </span>
        <span style={{ marginLeft: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              height: 28,
              padding: "0 12px 0 10px",
              border: "1px solid var(--line-strong)",
              borderRadius: 8,
              background: "var(--surface-raised)",
            }}
          >
            <button
              type="button"
              role="switch"
              aria-checked={autopilot}
              aria-label="Autopilot"
              onClick={() => setAutopilot((v) => !v)}
              style={{
                position: "relative",
                width: 34,
                height: 20,
                padding: 0,
                borderRadius: 999,
                border: `1px solid ${autopilot ? "var(--accent-line)" : "var(--line-strong)"}`,
                background: autopilot ? "var(--accent-soft)" : "var(--surface-card)",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: autopilot ? 17 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: autopilot ? "var(--accent)" : "var(--ink-faint)",
                  transition: "left 0.15s ease",
                }}
              />
            </button>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Autopilot</span>
            <span className="tr-small">{autopilot ? "Cursor CLI · on" : "off"}</span>
          </span>
        </span>
        <span style={{ marginLeft: "auto" }}>
          <span className="tr-seg" role="group">
            <button type="button" aria-pressed={boardMode} onClick={() => setBoardMode(true)}>
              Board
            </button>
            <button type="button" aria-pressed={!boardMode} onClick={() => setBoardMode(false)}>
              List
            </button>
          </span>
        </span>
      </div>

      {boardMode ? (
        <BoardKanban fixture={boardData} onOpenIssue={openIssue} />
      ) : (
        <BoardList groups={boardData.listGroups} onOpenRow={(row) => openIssue(listRowToCard(row))} />
      )}
      <IssueDetailModal
        open={issueDetail !== null}
        detail={issueDetail}
        modKey={modKey}
        onClose={closeIssue}
        onOpenWorktree={handleOpenWorktree}
      />
    </>
  );
}

function listRowToCard(row: BoardListRow): BoardCard {
  return {
    issue: row.issue,
    title: row.title,
    prioColor: "var(--blue)",
    prioLabel: "Medium",
    labels: [],
    adr: row.adr !== "—" ? row.adr : undefined,
    pr: row.pr !== "—" ? row.pr : undefined,
  };
}

function BoardKanban({
  fixture,
  onOpenIssue,
}: {
  fixture: ReturnType<typeof getBoardFixture>;
  onOpenIssue: (card: BoardCard) => void;
}) {
  return (
    <div
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        overflowX: "auto",
        overflowY: "hidden",
        boxSizing: "border-box",
        padding: "16px 24px 24px",
      }}
    >
      <div
        style={{
          width: "max-content",
          height: "100%",
          margin: "0 auto",
          display: "flex",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {fixture.columns.map((col) => (
          <KanbanColumn key={col.id} column={col} onOpenIssue={onOpenIssue} />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({ column, onOpenIssue }: { column: BoardColumn; onOpenIssue: (card: BoardCard) => void }) {
  const ring =
    column.autopilotHint && column.id === "todo"
      ? { border: "1px solid var(--accent-line)", boxShadow: "inset 0 0 0 1px var(--accent-line)" }
      : { border: "1px solid transparent" };

  return (
    <div className="bd-col" style={{ flex: "0 0 272px", height: "100%", minHeight: 0, borderRadius: 14, ...ring }}>
      <div className="tr-board-col">
        <div className="tr-board-head">
          <span className={`tr-sq tr-tone-${column.tone}`} />
          <strong>{column.name}</strong>
          <span className="tr-count">{column.count}</span>
        </div>
        <span className="tr-small">{column.ghLabel}</span>
        {column.autopilotHint ? (
          <span className="tr-small" style={{ marginBottom: 4 }}>
            Autopilot picks these up by priority, then top to bottom.
          </span>
        ) : null}
        {column.cards.map((card) => (
          <BoardCardRow key={card.issue} card={card} onOpenIssue={onOpenIssue} />
        ))}
      </div>
    </div>
  );
}

function BoardList({ groups, onOpenRow }: { groups: BoardListGroup[]; onOpenRow: (row: BoardListRow) => void }) {
  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", padding: "16px 24px 24px" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "56px minmax(0, 1fr) 90px 120px 120px 36px",
            gap: 12,
            alignItems: "center",
            padding: "8px 14px",
            borderBottom: "1px solid var(--line)",
            background: "var(--surface-raised)",
          }}
        >
          <span className="tr-overline">Issue</span>
          <span className="tr-overline">Title</span>
          <span className="tr-overline">Decision</span>
          <span className="tr-overline">Pull request</span>
          <span className="tr-overline">Sync</span>
          <span className="tr-overline">By</span>
        </div>
        {groups.map((g) => (
          <BoardListGroupBlock key={g.name} group={g} onOpenRow={onOpenRow} />
        ))}
      </div>
    </div>
  );
}

function BoardListGroupBlock({
  group,
  onOpenRow,
}: {
  group: BoardListGroup;
  onOpenRow: (row: BoardListRow) => void;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          background: "var(--surface-raised)",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <span className={`tr-sq tr-tone-${group.tone}`} />
        <strong style={{ fontSize: 13 }}>{group.name}</strong>
        <span className="tr-count">{group.count}</span>
      </div>
      {group.rows.map((r) => (
        <div
          key={r.issue}
          role="button"
          tabIndex={0}
          onClick={() => onOpenRow(r)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenRow(r);
            }
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "56px minmax(0, 1fr) 90px 120px 120px 36px",
            gap: 12,
            alignItems: "center",
            padding: "8px 14px",
            borderBottom: "1px solid var(--line-soft)",
            cursor: "pointer",
          }}
        >
          <span className="tr-mono tr-faint">{r.issue}</span>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
            {r.title}
          </span>
          <span className="tr-mono tr-faint">{r.adr}</span>
          <span className="tr-small">{r.pr}</span>
          <SyncStatus state="synced" label={r.syncLabel} />
          <span className="tr-mono tr-faint">{r.by}</span>
        </div>
      ))}
      {group.moreText ? (
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--line-soft)" }}>
          <span className="tr-small">{group.moreText}</span>
        </div>
      ) : null}
    </>
  );
}

function BoardCardRow({ card, onOpenIssue }: { card: BoardCard; onOpenIssue: (card: BoardCard) => void }) {
  return (
    <>
      {card.orderText ? (
        <span className="tr-mono tr-faint" style={{ fontSize: 11, marginBottom: -4 }}>
          {card.orderText}
        </span>
      ) : null}
      <IssueKanbanCard card={card} onClick={() => onOpenIssue(card)} />
    </>
  );
}