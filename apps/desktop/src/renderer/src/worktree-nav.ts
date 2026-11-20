import type { WorktreeDto, WorkspaceDto } from "@trail/ipc";
import type { WorktreeNavRow, WtDot } from "./design/fixture";

function statusToDot(status: WorktreeDto["status"]): WtDot {
  switch (status) {
    case "running":
      return "running";
    case "review":
      return "review";
    case "waiting":
      return "waiting";
    case "merged":
      return "merged";
    case "queued":
    case "stopped":
    case "failed":
    default:
      return "queued";
  }
}

export function worktreesToSidebar(
  workspace: WorkspaceDto | undefined,
  worktrees: WorktreeDto[],
): {
  local: WorktreeNavRow[];
  remote: WorktreeNavRow[];
  nLocal: number;
  nRemote: number;
  runText: string;
} {
  const integration = workspace?.integrationBranch ?? "development";
  const localRows: WorktreeNavRow[] = [
    { title: integration, sub: "base checkout", dot: "base" },
  ];
  const remoteRows: WorktreeNavRow[] = [];

  for (const wt of worktrees) {
    const row: WorktreeNavRow = {
      title: `#${wt.issueNumber} ${wt.title}`,
      sub: wt.branch,
      dot: statusToDot(wt.status),
    };
    if (wt.isRemote || wt.status === "merged") {
      remoteRows.push(row);
    } else {
      localRows.push(row);
    }
  }

  const running = worktrees.filter((wt) => wt.status === "running").length;
  const runText =
    running === 0
      ? "No worktrees running"
      : running === 1
        ? "1 worktree running"
        : `${running} worktrees running`;

  return {
    local: localRows,
    remote: remoteRows,
    nLocal: Math.max(0, localRows.length - 1),
    nRemote: remoteRows.length,
    runText,
  };
}