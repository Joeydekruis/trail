import type { WorkspaceDto } from "@trail/ipc";
import type { ShellView } from "./design/shell-layout";
import { ViewPageHeader } from "./design/ViewPageHeader";
import { TrailButton, TrailChip } from "./design/TrailUi";

export function RoadmapView({
  workspace,
  onGoToBoard,
}: {
  workspace: WorkspaceDto | undefined;
  onGoToBoard: (view: ShellView) => void;
}) {
  const repo = workspace?.id ?? "trail";
  return (
  <>
    <ViewPageHeader title="Roadmap" subtitle={`${repo} · milestones`} />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "96px 24px",
        background: "var(--surface)",
        border: "1px dashed var(--line-strong)",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      <TrailChip tone="gray">Coming soon</TrailChip>
      <h2 style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 600 }}>
        Roadmap is not in the first version
      </h2>
      <p style={{ margin: 0, maxWidth: 460, color: "var(--ink-muted)" }}>
        Epics and milestones will be shown here later. For now, plan work on the Board.
      </p>
      <TrailButton variant="ghost" onClick={() => onGoToBoard("board")}>
        Go to the board
      </TrailButton>
    </div>
  </>
  );
}