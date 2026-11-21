import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flattenBoardListGroups, type FlatBoardListItem } from "./board-list-flatten";
import { shouldVirtualizeList } from "./list-virtual-threshold";
import { VirtualScrollList } from "./virtual-scroll-list";
import type { BoardColumnIdDto, BoardSnapshotResult, WorktreeDto, WorkspaceDto } from "@trail/ipc";
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
import { issueNumberFromRef, worktreeCtaForIssue } from "./worktree-session";

type BoardViewProps = {
  workspace: WorkspaceDto | undefined;
  onSyncNow: () => void;
  syncing: boolean;
  boardRefreshKey?: number;
  onNewTask: () => void;
  modKey: string;
  worktrees: WorktreeDto[];
  onOpenWorktree: (issueNumber: number) => void;
  onRefreshWorktrees?: () => void;
};

export function BoardView({
  workspace,
  onSyncNow,
  syncing,
  boardRefreshKey = 0,
  onNewTask,
  modKey,
  worktrees,
  onOpenWorktree,
  onRefreshWorktrees,
}: BoardViewProps) {
  const fixture = getBoardFixture(workspace);
  const [boardMode, setBoardMode] = useState(true);
  const [autopilot, setAutopilot] = useState(true);
  const [issueDetail, setIssueDetail] = useState<IssueDetail | null>(null);
  const [liveBoard, setLiveBoard] = useState<BoardSnapshotResult | null>(null);
  const [kanbanColumns, setKanbanColumns] = useState<BoardColumn[] | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [worktreeBusy, setWorktreeBusy] = useState(false);
  const [worktreeError, setWorktreeError] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const canDrag = liveBoard?.source === "cache" && Boolean(workspace?.repository);

  useEffect(() => {
    const api = window.trail;
    if (!api?.getBoardSnapshot) {
      return;
    }
    void api.getBoardSnapshot(workspace?.id).then(setLiveBoard);
  }, [workspace?.id, syncing, boardRefreshKey]);

  useEffect(() => {
    if (liveBoard?.source === "cache") {
      setKanbanColumns(liveBoard.columns as BoardColumn[]);
      setMoveError(null);
    } else {
      setKanbanColumns(null);
    }
  }, [liveBoard]);

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
          const detail = result.detail as IssueDetail;
          const issueNumber = issueNumberFromRef(detail.issue);
          setIssueDetail({
            ...detail,
            cta:
              issueNumber !== null
                ? worktreeCtaForIssue(worktrees, issueNumber)
                : detail.cta,
          });
          return;
        }
        setIssueDetail(getIssueDetail(card));
      });
      return;
    }
    setIssueDetail(getIssueDetail(card));
  };
  const closeIssue = () => setIssueDetail(null);

  const handleMoveIssue = useCallback(
    async (issueRef: string, targetColumnId: BoardColumnIdDto) => {
      const api = window.trail;
      if (!canDrag || !kanbanColumns || !workspace?.id || !api?.moveBoardIssue) {
        return;
      }
      const match = /^#(\d+)$/.exec(issueRef);
      const issueNumber = match ? Number.parseInt(match[1], 10) : NaN;
      if (Number.isNaN(issueNumber)) {
        return;
      }

      const prev = kanbanColumns;
      const next = moveIssueOnBoard(prev, issueRef, targetColumnId);
      if (!next) {
        return;
      }

      setKanbanColumns(next);
      setMoveError(null);
      const result = await api.moveBoardIssue({
        workspaceId: workspace.id,
        issueNumber,
        targetColumn: targetColumnId,
      });
      if (!result.ok) {
        setKanbanColumns(prev);
        setMoveError(result.message);
        return;
      }
      void api.getBoardSnapshot?.(workspace.id).then(setLiveBoard);
    },
    [canDrag, kanbanColumns, workspace?.id],
  );
  const handleWorktreeAction = async () => {
    if (!issueDetail || !workspace?.id) {
      return;
    }
    const issueNumber = issueNumberFromRef(issueDetail.issue);
    if (issueNumber === null) {
      return;
    }
    const existing = worktrees.some((wt) => wt.issueNumber === issueNumber);
    if (existing) {
      closeIssue();
      onOpenWorktree(issueNumber);
      return;
    }
    const api = window.trail;
    if (!api?.createWorktree) {
      closeIssue();
      onOpenWorktree(issueNumber);
      return;
    }
    setWorktreeBusy(true);
    setWorktreeError(null);
    try {
      const result = await api.createWorktree({
        workspaceId: workspace.id,
        issueNumber,
        title: issueDetail.title,
      });
      if (!result.ok) {
        setWorktreeError(result.message);
        return;
      }
      onRefreshWorktrees?.();
      closeIssue();
      onOpenWorktree(issueNumber);
    } finally {
      setWorktreeBusy(false);
    }
  };

  const kanbanData =
    kanbanColumns !== null
      ? {
          ...boardData,
          columns: kanbanColumns,
          listGroups: kanbanColumns.map((column) => ({
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
          })),
        }
      : boardData;

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

      {moveError ? (
        <p
          className="tr-small"
          style={{
            margin: 0,
            padding: "0 24px",
            color: "var(--warning)",
          }}
        >
          {moveError}
        </p>
      ) : null}

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

      {worktreeError ? (
        <p className="tr-small" style={{ color: "var(--warning)", padding: "0 24px 8px", margin: 0 }}>
          {worktreeError}
        </p>
      ) : null}
      {boardMode ? (
        <BoardKanban
          fixture={kanbanData}
          canDrag={canDrag}
          dragOverColumnId={dragOverColumnId}
          onDragHoverColumn={setDragOverColumnId}
          onMoveIssue={handleMoveIssue}
          onOpenIssue={openIssue}
        />
      ) : (
        <BoardList groups={kanbanData.listGroups} onOpenRow={(row) => openIssue(listRowToCard(row))} />
      )}
      <IssueDetailModal
        open={issueDetail !== null}
        detail={issueDetail}
        modKey={modKey}
        onClose={closeIssue}
        onOpenWorktree={() => void handleWorktreeAction()}
        worktreeActionBusy={worktreeBusy}
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

function moveIssueOnBoard(
  columns: BoardColumn[],
  issueRef: string,
  targetColumnId: string,
): BoardColumn[] | null {
  let moved: BoardCard | undefined;
  const stripped = columns.map((column) => {
    const cards = column.cards.filter((card) => {
      if (card.issue === issueRef) {
        moved = card;
        return false;
      }
      return true;
    });
    return { ...column, cards, count: cards.length };
  });
  if (!moved) {
    return null;
  }
  const card = moved;
  return stripped.map((column) => {
    if (column.id !== targetColumnId) {
      return column;
    }
    const cards: BoardCard[] = [...column.cards, card];
    return { ...column, cards, count: cards.length };
  });
}

function BoardKanban({
  fixture,
  canDrag,
  dragOverColumnId,
  onDragHoverColumn,
  onMoveIssue,
  onOpenIssue,
}: {
  fixture: ReturnType<typeof getBoardFixture>;
  canDrag: boolean;
  dragOverColumnId: string | null;
  onDragHoverColumn: (columnId: string | null) => void;
  onMoveIssue: (issueRef: string, targetColumnId: BoardColumnIdDto) => void;
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
          <KanbanColumn
            key={col.id}
            column={col}
            canDrag={canDrag}
            dragActive={dragOverColumnId === col.id}
            onDragHoverColumn={onDragHoverColumn}
            onMoveIssue={onMoveIssue}
            onOpenIssue={onOpenIssue}
          />
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  column,
  canDrag,
  dragActive,
  onDragHoverColumn,
  onMoveIssue,
  onOpenIssue,
}: {
  column: BoardColumn;
  canDrag: boolean;
  dragActive: boolean;
  onDragHoverColumn: (columnId: string | null) => void;
  onMoveIssue: (issueRef: string, targetColumnId: BoardColumnIdDto) => void;
  onOpenIssue: (card: BoardCard) => void;
}) {
  const ring =
    column.autopilotHint && column.id === "todo"
      ? { border: "1px solid var(--accent-line)", boxShadow: "inset 0 0 0 1px var(--accent-line)" }
      : { border: "1px solid transparent" };
  const dropHighlight = dragActive
    ? { border: "1px solid var(--accent)", boxShadow: "inset 0 0 0 1px var(--accent-line)" }
    : null;

  return (
    <div
      className="bd-col"
      style={{ flex: "0 0 272px", height: "100%", minHeight: 0, borderRadius: 14, ...ring, ...dropHighlight }}
      onDragOver={(event) => {
        if (!canDrag) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragHoverColumn(column.id);
      }}
      onDragLeave={() => {
        if (dragActive) {
          onDragHoverColumn(null);
        }
      }}
      onDrop={(event) => {
        if (!canDrag) {
          return;
        }
        event.preventDefault();
        onDragHoverColumn(null);
        const issueRef = event.dataTransfer.getData("text/trail-issue");
        if (issueRef) {
          onMoveIssue(issueRef, column.id as BoardColumnIdDto);
        }
      }}
    >
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
          <BoardCardRow
            key={card.issue}
            card={card}
            draggable={canDrag}
            onOpenIssue={onOpenIssue}
          />
        ))}
      </div>
    </div>
  );
}

const BOARD_LIST_ROW_ESTIMATE_PX = 37;

function BoardList({ groups, onOpenRow }: { groups: BoardListGroup[]; onOpenRow: (row: BoardListRow) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const flatItems = useMemo(() => flattenBoardListGroups(groups), [groups]);
  const virtual = shouldVirtualizeList(flatItems.length);

  return (
    <div
      ref={virtual ? scrollRef : undefined}
      style={{
        flex: "1 1 auto",
        minHeight: 0,
        overflow: "auto",
        padding: "16px 24px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 10,
          overflow: "hidden",
          ...(virtual ? { display: "flex", flexDirection: "column", maxHeight: "100%" } : {}),
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
            flex: "0 0 auto",
          }}
        >
          <span className="tr-overline">Issue</span>
          <span className="tr-overline">Title</span>
          <span className="tr-overline">Decision</span>
          <span className="tr-overline">Pull request</span>
          <span className="tr-overline">Sync</span>
          <span className="tr-overline">By</span>
        </div>
        {virtual ? (
          <VirtualScrollList
            scrollRef={scrollRef}
            items={flatItems}
            estimateSize={BOARD_LIST_ROW_ESTIMATE_PX}
            getItemKey={(item) => item.key}
            renderItem={(item) => <BoardListFlatItem item={item} onOpenRow={onOpenRow} />}
          />
        ) : (
          groups.map((g) => <BoardListGroupBlock key={g.name} group={g} onOpenRow={onOpenRow} />)
        )}
      </div>
    </div>
  );
}

function BoardListFlatItem({
  item,
  onOpenRow,
}: {
  item: FlatBoardListItem;
  onOpenRow: (row: BoardListRow) => void;
}) {
  if (item.type === "header") {
    return (
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
        <span className={`tr-sq tr-tone-${item.tone}`} />
        <strong style={{ fontSize: 13 }}>{item.name}</strong>
        <span className="tr-count">{item.count}</span>
      </div>
    );
  }
  if (item.type === "more") {
    return (
      <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--line-soft)" }}>
        <span className="tr-small">{item.text}</span>
      </div>
    );
  }
  return <BoardListDataRow row={item.row} onOpenRow={onOpenRow} />;
}

function BoardListDataRow({
  row,
  onOpenRow,
}: {
  row: BoardListRow;
  onOpenRow: (row: BoardListRow) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenRow(row)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenRow(row);
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
      <span className="tr-mono tr-faint">{row.issue}</span>
      <span
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: 500,
        }}
      >
        {row.title}
      </span>
      <span className="tr-mono tr-faint">{row.adr}</span>
      <span className="tr-small">{row.pr}</span>
      <SyncStatus state="synced" label={row.syncLabel} />
      <span className="tr-mono tr-faint">{row.by}</span>
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
        <BoardListDataRow key={r.issue} row={r} onOpenRow={onOpenRow} />
      ))}
      {group.moreText ? (
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--line-soft)" }}>
          <span className="tr-small">{group.moreText}</span>
        </div>
      ) : null}
    </>
  );
}

function BoardCardRow({
  card,
  draggable,
  onOpenIssue,
}: {
  card: BoardCard;
  draggable: boolean;
  onOpenIssue: (card: BoardCard) => void;
}) {
  return (
    <>
      {card.orderText ? (
        <span className="tr-mono tr-faint" style={{ fontSize: 11, marginBottom: -4 }}>
          {card.orderText}
        </span>
      ) : null}
      <div
        draggable={draggable}
        onDragStart={(event) => {
          if (!draggable) {
            return;
          }
          event.dataTransfer.setData("text/trail-issue", card.issue);
          event.dataTransfer.effectAllowed = "move";
        }}
      >
        <IssueKanbanCard card={card} onClick={() => onOpenIssue(card)} />
      </div>
    </>
  );
}