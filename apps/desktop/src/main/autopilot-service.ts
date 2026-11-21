import {
  APP_SETTING_AUTOPILOT_GLOBAL_PAUSE,
  autopilotQueueBlockedByDecisions,
  pickAutopilotIssue,
  syncProposedDecisionBlocks,
  resolveAutopilotEnabled,
  resolveAutopilotGlobalPause,
  resolveAutopilotMaxParallel,
  resolveAutopilotPickupLabels,
  workspaceAutopilotEnabledKey,
  workspaceAutopilotMaxParallelKey,
  workspaceAutopilotPickupLabelsKey,
} from "@trail/core";
import { countActiveAgentRuns } from "./agent-runner-bridge";
import { startAgentRun } from "./agent-run";
import {
  getDecisionStore,
  getIssueCacheStore,
  getWorktreeStore,
  getWorkspaceStore,
} from "./database";
import { readWorkspaceRepoRoot } from "./worktree-paths";
import { createLocalWorktree } from "./worktree-create";
import { moveBoardIssue } from "./board-move-issue";

const TICK_MS = 20_000;
let timer: ReturnType<typeof setInterval> | null = null;
let ticking = false;

export function readAutopilotSettings(workspaceId: string): {
  enabled: boolean;
  globallyPaused: boolean;
  queueBlocked: boolean;
  maxParallel: number;
  pickupLabels: string[];
} {
  const store = getWorkspaceStore();
  const worktrees = getWorktreeStore().listByWorkspace(workspaceId);
  return {
    enabled: resolveAutopilotEnabled(
      store.getAppSetting(workspaceAutopilotEnabledKey(workspaceId)),
    ),
    globallyPaused: resolveAutopilotGlobalPause(
      store.getAppSetting(APP_SETTING_AUTOPILOT_GLOBAL_PAUSE),
    ),
    queueBlocked: autopilotQueueBlockedByDecisions(worktrees),
    maxParallel: resolveAutopilotMaxParallel(
      store.getAppSetting(workspaceAutopilotMaxParallelKey(workspaceId)),
    ),
    pickupLabels: resolveAutopilotPickupLabels(
      store.getAppSetting(workspaceAutopilotPickupLabelsKey(workspaceId)),
    ),
  };
}

export function writeAutopilotSettings(
  workspaceId: string,
  patch: Partial<{
    enabled: boolean;
    globallyPaused: boolean;
    maxParallel: number;
    pickupLabels: string[];
  }>,
): {
  enabled: boolean;
  globallyPaused: boolean;
  queueBlocked: boolean;
  maxParallel: number;
  pickupLabels: string[];
} {
  const store = getWorkspaceStore();
  if (patch.globallyPaused !== undefined) {
    store.setAppSetting(
      APP_SETTING_AUTOPILOT_GLOBAL_PAUSE,
      patch.globallyPaused ? "1" : "0",
    );
  }
  if (patch.enabled !== undefined) {
    store.setAppSetting(
      workspaceAutopilotEnabledKey(workspaceId),
      patch.enabled ? "1" : "0",
    );
  }
  if (patch.maxParallel !== undefined) {
    store.setAppSetting(
      workspaceAutopilotMaxParallelKey(workspaceId),
      String(patch.maxParallel),
    );
  }
  if (patch.pickupLabels !== undefined) {
    store.setAppSetting(
      workspaceAutopilotPickupLabelsKey(workspaceId),
      JSON.stringify(patch.pickupLabels),
    );
  }
  return readAutopilotSettings(workspaceId);
}

export async function runAutopilotTick(workspaceId?: string): Promise<void> {
  if (ticking) {
    return;
  }
  ticking = true;
  try {
    const workspaceStore = getWorkspaceStore();
    const id = workspaceId ?? workspaceStore.getActiveId();
    const issueStore = getIssueCacheStore();
    const worktreeStore = getWorktreeStore();
    syncProposedDecisionBlocks(id, getDecisionStore(), worktreeStore);
    const worktrees = worktreeStore.listByWorkspace(id);
    const settings = readAutopilotSettings(id);
    if (!settings.enabled || settings.globallyPaused) {
      return;
    }
    if (settings.queueBlocked || autopilotQueueBlockedByDecisions(worktrees)) {
      return;
    }
    if (!readWorkspaceRepoRoot(workspaceStore, id)) {
      return;
    }

    const activeRuns = countActiveAgentRuns();
    const slots = settings.maxParallel - activeRuns;
    if (slots <= 0) {
      return;
    }

    const issues = issueStore.listByWorkspace(id);

    for (let slot = 0; slot < slots; slot += 1) {
      const next = pickAutopilotIssue(issues, worktrees, settings.pickupLabels);
      if (!next) {
        break;
      }
      if (next.boardColumn === "todo") {
        const moved = await moveBoardIssue({
          workspaces: workspaceStore,
          issues: issueStore,
          workspaceId: id,
          issueNumber: next.number,
          targetColumn: "in-progress",
        });
        if (!moved.ok) {
          console.warn("[trail] autopilot board move:", moved.message);
          break;
        }
        next.boardColumn = "in-progress";
      }
      const created = createLocalWorktree({
        workspaceStore,
        worktreeStore,
        issueStore,
        workspaceId: id,
        issueNumber: next.number,
        title: next.title,
      });
      if (!created.ok) {
        console.warn("[trail] autopilot worktree:", created.message);
        break;
      }
      worktrees.push(created.record);
      const started = await startAgentRun({
        workspaceId: id,
        issueNumber: next.number,
      });
      if (!started.ok) {
        console.warn("[trail] autopilot run:", started.message);
        worktreeStore.updateStatus(id, next.number, "failed");
        break;
      }
    }
  } finally {
    ticking = false;
  }
}

export function startAutopilotScheduler(): void {
  if (timer) {
    return;
  }
  timer = setInterval(() => {
    void runAutopilotTick();
  }, TICK_MS);
  void runAutopilotTick();
}

export function stopAutopilotScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}