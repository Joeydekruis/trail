import { contextBridge, ipcRenderer } from "electron";
import { onAgentStreamOutput, registerAgentStreamBridge } from "./agent-stream-bridge";
import { PreloadIpcChannels } from "./channels";

registerAgentStreamBridge();

export type WorkspaceListResult = {
  workspaces: Array<{
    id: string;
    name: string;
    shortLabel: string;
    repository: string | null;
    integrationBranch: string;
    productionBranch: string;
    accent: string;
    accentSoft: string;
    accentLine: string;
    onAccent: string;
  }>;
  activeWorkspaceId: string;
  needsOnboarding: boolean;
  github: { connected: boolean; login?: string };
  activeLastSyncedAt: string | null;
};

export type WorkspaceSwitchResult = {
  active: WorkspaceListResult["workspaces"][number];
  workspaces: WorkspaceListResult["workspaces"];
};

export type GithubRepoDto = {
  fullName: string;
  description: string | null;
  openIssuesCount: number;
};

export type TrailApi = {
  platform: NodeJS.Platform;
  /** Set when main runs with TRAIL_E2E=1 (Playwright perf budgets). */
  e2eMode: boolean;
  listWorkspaces: () => Promise<WorkspaceListResult>;
  switchWorkspace: (workspaceId: string) => Promise<WorkspaceSwitchResult>;
  createWorkspace: (input: {
    repository: string;
    name?: string;
    integrationBranch?: string;
    productionBranch?: string;
  }) => Promise<WorkspaceSwitchResult>;
  githubStatus: () => Promise<{ connected: boolean; login?: string }>;
  githubSetToken: (
    token: string,
  ) => Promise<{ ok: true; login: string } | { ok: false; message: string }>;
  githubListRepos: () => Promise<{ repos: GithubRepoDto[] }>;
  githubListBranches: (repository: string) => Promise<{ branches: string[]; error?: string }>;
  githubClearToken: () => Promise<{ cleared: true }>;
  getGithubBoardMapping: (workspaceId?: string) => Promise<{
    projectStatusField: string;
    syncIntervalSec: number;
  }>;
  setGithubBoardMapping: (input: {
    workspaceId?: string;
    projectStatusField?: string;
    syncIntervalSec?: number;
  }) => Promise<{ projectStatusField: string; syncIntervalSec: number }>;
  onBackgroundSync: (
    listener: (payload: { workspaceId: string; syncedAt: string; issueCount: number }) => void,
  ) => () => void;
  onBackgroundSyncError: (
    listener: (payload: {
      workspaceId: string;
      message: string;
      retryAfterSec?: number;
      rateLimited?: boolean;
    }) => void,
  ) => () => void;
  createIssue: (input: {
    workspaceId?: string;
    title: string;
    body: string;
    type: import("@trail/ipc").IssueCreatePayload["type"];
    priority: import("@trail/ipc").IssueCreatePayload["priority"];
    agentReady?: boolean;
  }) => Promise<
    | { ok: true; issueNumber: number; htmlUrl: string }
    | { ok: false; message: string }
  >;
  getIssueDetail: (input: {
    workspaceId?: string;
    issueNumber: number;
  }) => Promise<
    | { found: true; detail: import("@trail/ipc").IssueDetailDto }
    | { found: false }
  >;
  moveBoardIssue: (input: {
    workspaceId?: string;
    issueNumber: number;
    targetColumn: import("@trail/ipc").BoardColumnIdDto;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  getBoardSnapshot: (workspaceId?: string) => Promise<{
    source: "cache" | "fixture";
    repository: string | null;
    openCount: number;
    columns: Array<{
      id: string;
      name: string;
      count: number;
      tone: "gray" | "blue" | "mint" | "violet" | "amber";
      ghLabel: string;
      cards: Array<{
        issue: string;
        title: string;
        prioColor: string;
        prioLabel: string;
        labels: Array<{ text: string; tone: "blue" | "mint" | "gray" | "violet" }>;
      }>;
    }>;
  }>;
  syncNow: (workspaceId?: string) => Promise<import("@trail/ipc").SyncNowResult>;
  listSyncConflicts: (
    workspaceId?: string,
  ) => Promise<{ conflicts: import("@trail/ipc").SyncConflictDto[] }>;
  resolveSyncConflict: (input: {
    workspaceId?: string;
    issueNumber: number;
    useGitHubForAll?: boolean;
    picks?: {
      state?: "github" | "trail";
      boardColumn?: "github" | "trail";
      labels?: "github" | "trail";
      assignee?: "github" | "trail";
    };
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  listWorktrees: (workspaceId?: string) => Promise<{
    worktrees: import("@trail/ipc").WorktreeDto[];
    repoRoot: string | null;
    worktreeRoot: string | null;
  }>;
  createWorktree: (input: {
    workspaceId?: string;
    issueNumber: number;
    title?: string;
  }) => Promise<
    | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
    | { ok: false; message: string }
  >;
  agentStatus: () => Promise<{ backends: import("@trail/ipc").AgentBackendStatusDto[] }>;
  startAgentRun: (input: {
    workspaceId?: string;
    issueNumber: number;
    prompt?: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  stopAgentRun: (input: {
    workspaceId?: string;
    issueNumber: number;
  }) => Promise<{ stopped: boolean }>;
  autopilotGet: (workspaceId?: string) => Promise<import("@trail/ipc").AutopilotGetResult>;
  autopilotSet: (
    input: import("@trail/ipc").AutopilotSetPayload,
  ) => Promise<import("@trail/ipc").AutopilotSetResult>;
  onAgentStreamOutput: (
    listener: (payload: {
      workspaceId: string;
      issueNumber: number;
      stream: "stdout" | "stderr";
      line: string;
      backend: "cursor" | "claude" | null;
    }) => void,
  ) => () => void;
  onAgentOutput: (
    listener: (payload: {
      workspaceId: string;
      issueNumber: number;
      stream: "stdout" | "stderr";
      line: string;
      backend: "cursor" | "claude" | null;
    }) => void,
  ) => () => void;
  onAgentRunState: (
    listener: (payload: {
      workspaceId: string;
      issueNumber: number;
      state: "running" | "stopped";
      exitCode?: number;
    }) => void,
  ) => () => void;
  previewAttach: (input: {
    workspaceId: string;
    issueNumber: number;
    url?: string;
  }) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;
  previewSetBounds: (input: {
    workspaceId: string;
    issueNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<void>;
  previewDetach: (input: {
    workspaceId: string;
    issueNumber: number;
  }) => Promise<void>;
  previewEnsureDevServer: (input: {
    workspaceId: string;
    issueNumber: number;
  }) => Promise<
    | { ok: true; url: string; started: boolean }
    | { ok: false; message: string }
  >;
  previewNavigate: (input: {
    workspaceId: string;
    issueNumber: number;
    url: string;
  }) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;
  previewSetCommentMode: (input: {
    workspaceId: string;
    issueNumber: number;
    enabled: boolean;
  }) => Promise<void>;
  e2eSimulatePreviewPin: (input: {
    workspaceId: string;
    issueNumber: number;
    comment: string;
  }) => Promise<{ ok: true; pinNumber: number } | { ok: false; message: string }>;
  listDesigns: (workspaceId?: string) => Promise<import("@trail/ipc").DesignListResult>;
  getDesignPreviewUrl: (input: {
    workspaceId?: string;
    relativePath: string;
  }) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;
  listKnowledgeDocs: (workspaceId?: string) => Promise<import("@trail/ipc").KnowledgeDocListResult>;
  getKnowledgeDoc: (input: {
    workspaceId?: string;
    slug: string;
  }) => Promise<
    | { ok: true; doc: import("@trail/ipc").KnowledgeDocDto }
    | { ok: false; message: string }
  >;
  saveKnowledgeDoc: (input: {
    workspaceId?: string;
    slug?: string;
    title: string;
    bodyMarkdown: string;
  }) => Promise<{ doc: import("@trail/ipc").KnowledgeDocDto }>;
  listDecisions: (workspaceId?: string) => Promise<import("@trail/ipc").DecisionListResult>;
  getDecision: (input: {
    workspaceId?: string;
    adrId: string;
  }) => Promise<import("@trail/ipc").DecisionGetResult>;
  acceptDecision: (input: {
    workspaceId?: string;
    adrId: string;
  }) => Promise<import("@trail/ipc").DecisionAcceptResult>;
  rejectDecision: (input: {
    workspaceId?: string;
    adrId: string;
  }) => Promise<import("@trail/ipc").DecisionRejectResult>;
  createDecision: (
    input: import("@trail/ipc").DecisionCreatePayload,
  ) => Promise<import("@trail/ipc").DecisionCreateResult>;
  exportDecisionMarkdown: (input?: {
    workspaceId?: string;
    adrId?: string;
  }) => Promise<import("@trail/ipc").DecisionExportMarkdownResult>;
  resolveDecisionContentConflict: (
    input: import("@trail/ipc").DecisionResolveContentConflictPayload,
  ) => Promise<import("@trail/ipc").DecisionResolveContentConflictResult>;
  onPreviewPin: (
    listener: (payload: import("@trail/ipc").PreviewPinEventDto) => void,
  ) => () => void;
  setWorktreeStatus: (input: {
    workspaceId?: string;
    issueNumber: number;
    status: import("@trail/ipc").WorktreeDto["status"];
  }) => Promise<
    | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
    | { ok: false; message: string }
  >;
  getRepoRoot: (workspaceId?: string) => Promise<{
    repoRoot: string | null;
    worktreeRoot: string | null;
  }>;
  setRepoRoot: (input: {
    workspaceId?: string;
    repoRoot: string | null;
    worktreeRoot?: string;
  }) => Promise<{
    repoRoot: string | null;
    worktreeRoot: string;
    message?: string;
  }>;
  pickRepoRoot: () => Promise<
    | { ok: true; path: string }
    | { ok: false; cancelled: true }
    | { ok: false; message: string }
  >;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  openPath: (path: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  getDiagnosticsSnapshot: (input?: {
    openViewCount?: number;
  }) => Promise<import("@trail/ipc").DiagnosticsGetSnapshotResult>;
  diagnosticsMarkRendererReady: (input?: { at?: number }) => Promise<{ ok: true }>;
  diagnosticsReportWorkspaceSwitch: (input: {
    durationMs: number;
    openViewCount?: number;
  }) => Promise<{ ok: true }>;
  mcpConnection: () => Promise<import("@trail/ipc").McpConnectionResult>;
  mcpSettingsGet: (workspaceId?: string) => Promise<import("@trail/ipc").McpSettingsGetResult>;
  mcpSettingsSet: (
    input: import("@trail/ipc").McpSettingsSetPayload,
  ) => Promise<import("@trail/ipc").McpSettingsSetResult>;
};

const trailApi: TrailApi = {
  platform: process.platform,
  e2eMode: process.env.TRAIL_E2E === "1",
  listWorkspaces: () =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceList) as Promise<WorkspaceListResult>,
  switchWorkspace: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceSwitch, {
      workspaceId,
    }) as Promise<WorkspaceSwitchResult>,
  createWorkspace: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceCreate, input) as Promise<WorkspaceSwitchResult>,
  githubStatus: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubStatus) as Promise<{
      connected: boolean;
      login?: string;
    }>,
  githubSetToken: (token) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubSetToken, { token }) as Promise<
      { ok: true; login: string } | { ok: false; message: string }
    >,
  githubListRepos: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubListRepos) as Promise<{
      repos: GithubRepoDto[];
    }>,
  githubListBranches: (repository) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubListBranches, { repository }) as Promise<{
      branches: string[];
      error?: string;
    }>,
  githubClearToken: () =>
    ipcRenderer.invoke(PreloadIpcChannels.githubClearToken) as Promise<{
      cleared: true;
    }>,
  getGithubBoardMapping: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubBoardMappingGet, { workspaceId }) as Promise<{
      projectStatusField: string;
      syncIntervalSec: number;
    }>,
  setGithubBoardMapping: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.githubBoardMappingSet, input) as Promise<{
      projectStatusField: string;
      syncIntervalSec: number;
    }>,
  onBackgroundSync: (listener) => {
    const channel = "trail.backgroundSync";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: { workspaceId: string; syncedAt: string; issueCount: number },
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  onBackgroundSyncError: (listener) => {
    const channel = "trail.backgroundSyncError";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: {
        workspaceId: string;
        message: string;
        retryAfterSec?: number;
        rateLimited?: boolean;
      },
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  createIssue: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.issueCreate, input) as Promise<
      | { ok: true; issueNumber: number; htmlUrl: string }
      | { ok: false; message: string }
    >,
  getIssueDetail: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.issueGet, input) as Promise<
      | { found: true; detail: import("@trail/ipc").IssueDetailDto }
      | { found: false }
    >,
  moveBoardIssue: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.boardMoveIssue, input) as Promise<
      { ok: true } | { ok: false; message: string }
    >,
  getBoardSnapshot: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.boardSnapshot, { workspaceId }) as Promise<{
      source: "cache" | "fixture";
      repository: string | null;
      openCount: number;
      columns: Array<{
        id: string;
        name: string;
        count: number;
        tone: "gray" | "blue" | "mint" | "violet" | "amber";
        ghLabel: string;
        cards: Array<{
          issue: string;
          title: string;
          prioColor: string;
          prioLabel: string;
          labels: Array<{ text: string; tone: "blue" | "mint" | "gray" | "violet" }>;
        }>;
      }>;
    }>,
  syncNow: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.syncNow, { workspaceId }) as Promise<
      | { ok: true; syncedAt: string; issueCount: number; conflictCount: number }
      | { ok: false; message: string }
    >,
  listSyncConflicts: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.syncConflictList, { workspaceId }) as Promise<{
      conflicts: import("@trail/ipc").SyncConflictDto[];
    }>,
  resolveSyncConflict: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.syncConflictResolve, input) as Promise<
      { ok: true } | { ok: false; message: string }
    >,
  listWorktrees: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.worktreeList, { workspaceId }) as Promise<{
      worktrees: import("@trail/ipc").WorktreeDto[];
      repoRoot: string | null;
      worktreeRoot: string | null;
    }>,
  createWorktree: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.worktreeCreate, input) as Promise<
      | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
      | { ok: false; message: string }
    >,
  agentStatus: () =>
    ipcRenderer.invoke(PreloadIpcChannels.agentStatus) as Promise<{
      backends: import("@trail/ipc").AgentBackendStatusDto[];
    }>,
  startAgentRun: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.agentRunStart, input) as Promise<
      { ok: true } | { ok: false; message: string }
    >,
  stopAgentRun: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.agentRunStop, input) as Promise<{
      stopped: boolean;
    }>,
  autopilotGet: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.autopilotGet, { workspaceId }) as Promise<
      import("@trail/ipc").AutopilotGetResult
    >,
  autopilotSet: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.autopilotSet, input) as Promise<
      import("@trail/ipc").AutopilotSetResult
    >,
  previewAttach: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewAttach, input) as Promise<
      { ok: true; url: string } | { ok: false; message: string }
    >,
  previewSetBounds: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewSetBounds, input) as Promise<void>,
  previewDetach: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewDetach, input) as Promise<void>,
  previewEnsureDevServer: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewEnsureDevServer, input) as Promise<
      | { ok: true; url: string; started: boolean }
      | { ok: false; message: string }
    >,
  previewNavigate: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewNavigate, input) as Promise<
      { ok: true; url: string } | { ok: false; message: string }
    >,
  previewSetCommentMode: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewCommentMode, input) as Promise<void>,
  e2eSimulatePreviewPin: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.previewE2eSimulatePin, input) as Promise<
      { ok: true; pinNumber: number } | { ok: false; message: string }
    >,
  listDesigns: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.designList, { workspaceId }) as Promise<
      import("@trail/ipc").DesignListResult
    >,
  getDesignPreviewUrl: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.designPreviewUrl, input) as Promise<
      { ok: true; url: string } | { ok: false; message: string }
    >,
  listKnowledgeDocs: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.knowledgeDocList, { workspaceId }) as Promise<
      import("@trail/ipc").KnowledgeDocListResult
    >,
  getKnowledgeDoc: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.knowledgeDocGet, input) as Promise<
      | { ok: true; doc: import("@trail/ipc").KnowledgeDocDto }
      | { ok: false; message: string }
    >,
  saveKnowledgeDoc: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.knowledgeDocSave, input) as Promise<{
      doc: import("@trail/ipc").KnowledgeDocDto;
    }>,
  listDecisions: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionList, { workspaceId }) as Promise<
      import("@trail/ipc").DecisionListResult
    >,
  getDecision: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionGet, input) as Promise<
      import("@trail/ipc").DecisionGetResult
    >,
  acceptDecision: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionAccept, input) as Promise<
      import("@trail/ipc").DecisionAcceptResult
    >,
  rejectDecision: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionReject, input) as Promise<
      import("@trail/ipc").DecisionRejectResult
    >,
  createDecision: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionCreate, input) as Promise<
      import("@trail/ipc").DecisionCreateResult
    >,
  exportDecisionMarkdown: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionExportMarkdown, input ?? {}) as Promise<
      import("@trail/ipc").DecisionExportMarkdownResult
    >,
  resolveDecisionContentConflict: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.decisionResolveContentConflict, input) as Promise<
      import("@trail/ipc").DecisionResolveContentConflictResult
    >,
  onPreviewPin: (listener) => {
    const channel = "trail.previewPin";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: import("@trail/ipc").PreviewPinEventDto,
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  onAgentStreamOutput: (listener) => onAgentStreamOutput(listener),
  onAgentOutput: (listener) => {
    const channel = "trail.agentOutput";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: {
        workspaceId: string;
        issueNumber: number;
        stream: "stdout" | "stderr";
        line: string;
        backend: "cursor" | "claude" | null;
      },
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  onAgentRunState: (listener) => {
    const channel = "trail.agentRunState";
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: {
        workspaceId: string;
        issueNumber: number;
        state: "running" | "stopped";
        exitCode?: number;
      },
    ) => {
      listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
  setWorktreeStatus: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.worktreeSetStatus, input) as Promise<
      | { ok: true; worktree: import("@trail/ipc").WorktreeDto }
      | { ok: false; message: string }
    >,
  getRepoRoot: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootGet, { workspaceId }) as Promise<{
      repoRoot: string | null;
      worktreeRoot: string | null;
    }>,
  setRepoRoot: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootSet, input) as Promise<{
      repoRoot: string | null;
      worktreeRoot: string;
      message?: string;
    }>,
  pickRepoRoot: () =>
    ipcRenderer.invoke(PreloadIpcChannels.workspaceRepoRootPick) as Promise<
      | { ok: true; path: string }
      | { ok: false; cancelled: true }
      | { ok: false; message: string }
    >,
  minimize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMinimize) as Promise<void>,
  maximize: () => ipcRenderer.invoke(PreloadIpcChannels.windowMaximize) as Promise<void>,
  close: () => ipcRenderer.invoke(PreloadIpcChannels.windowClose) as Promise<void>,
  openExternal: (url) =>
    ipcRenderer.invoke(PreloadIpcChannels.shellOpenExternal, { url }) as Promise<void>,
  openPath: (path) =>
    ipcRenderer.invoke(PreloadIpcChannels.shellOpenPath, { path }) as Promise<
      { ok: true } | { ok: false; message: string }
    >,
  getDiagnosticsSnapshot: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.diagnosticsGetSnapshot, input ?? {}) as Promise<
      import("@trail/ipc").DiagnosticsGetSnapshotResult
    >,
  diagnosticsMarkRendererReady: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.diagnosticsMarkRendererReady, input ?? {}) as Promise<{
      ok: true;
    }>,
  diagnosticsReportWorkspaceSwitch: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.diagnosticsReportWorkspaceSwitch, input) as Promise<{
      ok: true;
    }>,
  mcpConnection: () =>
    ipcRenderer.invoke(PreloadIpcChannels.mcpConnection) as Promise<
      import("@trail/ipc").McpConnectionResult
    >,
  mcpSettingsGet: (workspaceId) =>
    ipcRenderer.invoke(PreloadIpcChannels.mcpSettingsGet, { workspaceId }) as Promise<
      import("@trail/ipc").McpSettingsGetResult
    >,
  mcpSettingsSet: (input) =>
    ipcRenderer.invoke(PreloadIpcChannels.mcpSettingsSet, input) as Promise<
      import("@trail/ipc").McpSettingsSetResult
    >,
};

try {
  if (process.contextIsolated) {
    contextBridge.exposeInMainWorld("trail", trailApi);
  } else {
    // Legacy path when context isolation is off (should not happen in production).
    const g = globalThis as typeof globalThis & { trail?: TrailApi };
    g.trail = trailApi;
  }
  console.info("[trail] Preload bridge exposed");
} catch (error) {
  console.error("[trail] Preload failed to expose bridge:", error);
}