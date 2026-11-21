import type { IssueCacheRecord } from "./types.js";
import type {
  IssueSyncConflictRecord,
  IssueSyncConflictSide,
  SyncConflictResolutionPicks,
} from "./sync-conflict-types.js";

function labelsKey(labels: string[]): string {
  return [...labels].sort((a, b) => a.localeCompare(b)).join("\0");
}

function sideFromIssue(issue: IssueCacheRecord): IssueSyncConflictSide {
  return {
    state: issue.state,
    boardColumn: issue.boardColumn,
    labels: [...issue.labels],
    updatedAt: issue.updatedAt,
  };
}

export function issueSidesDiffer(
  local: IssueCacheRecord,
  remote: IssueCacheRecord,
): boolean {
  if (local.state !== remote.state) {
    return true;
  }
  if (local.boardColumn !== remote.boardColumn) {
    return true;
  }
  return labelsKey(local.labels) !== labelsKey(remote.labels);
}

export function mergeWorkspaceIssuesFromGitHub(
  workspaceId: string,
  localIssues: IssueCacheRecord[],
  remoteIssues: IssueCacheRecord[],
  detectedAt: string,
): {
  merged: IssueCacheRecord[];
  conflicts: IssueSyncConflictRecord[];
} {
  const localByNumber = new Map(localIssues.map((row) => [row.number, row]));
  const remoteByNumber = new Map(remoteIssues.map((row) => [row.number, row]));
  const merged: IssueCacheRecord[] = [];
  const conflicts: IssueSyncConflictRecord[] = [];

  for (const remote of remoteIssues) {
    const local = localByNumber.get(remote.number);
    if (!local) {
      merged.push(remote);
      continue;
    }
    if (issueSidesDiffer(local, remote)) {
      conflicts.push({
        workspaceId,
        issueNumber: remote.number,
        title: remote.title,
        github: sideFromIssue(remote),
        trail: sideFromIssue(local),
        detectedAt,
      });
      merged.push(local);
      continue;
    }
    merged.push(remote);
  }

  for (const local of localIssues) {
    if (!remoteByNumber.has(local.number)) {
      merged.push(local);
    }
  }

  merged.sort((a, b) => a.number - b.number);
  conflicts.sort((a, b) => a.issueNumber - b.issueNumber);
  return { merged, conflicts };
}

export function applySyncConflictPicks(
  conflict: IssueSyncConflictRecord,
  picks: SyncConflictResolutionPicks,
  useGitHubForAll: boolean,
): { state: string; boardColumn: IssueSyncConflictSide["boardColumn"]; labels: string[] } {
  const pick = (field: keyof SyncConflictResolutionPicks): "github" | "trail" => {
    if (useGitHubForAll) {
      return "github";
    }
    const side = picks[field];
    if (side === "github" || side === "trail") {
      return side;
    }
    return "github";
  };
  const from = (side: "github" | "trail") =>
    side === "github" ? conflict.github : conflict.trail;
  return {
    state: from(pick("state")).state,
    boardColumn: from(pick("boardColumn")).boardColumn,
    labels: [...from(pick("labels")).labels],
  };
}