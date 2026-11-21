/** Desktop domain layer — sync, worktrees, config. Migrate logic from @trail-pm/cli over time. */

export const TRAIL_CORE_VERSION = "0.0.0" as const;

export type { SqliteDatabase, SqliteStatement } from "./db/types.js";
export type { WorkspaceAccent, WorkspaceRecord } from "./workspace/types.js";
export { WorkspaceStore, openWorkspaceStore } from "./workspace/store.js";
export { MemorySqlite, openInMemoryWorkspaceStore } from "./db/memory.js";
export { formatWorkspaceRepoLine } from "./workspace/format.js";
export type { WorkspaceCreateInput } from "./workspace/store.js";
export {
  workspaceIdFromRepository,
  workspaceNameFromRepository,
  shortLabelFromName,
} from "./workspace/repository.js";
export {
  APP_SETTING_GITHUB_LOGIN,
  DEFAULT_PROJECT_STATUS_FIELD,
  DEFAULT_SYNC_INTERVAL_SEC,
  resolveProjectStatusField,
  resolveSyncIntervalSec,
  workspaceLastSyncKey,
  workspaceProjectStatusFieldKey,
  workspaceSyncIntervalKey,
} from "./workspace/settings.js";
export type { IssueCacheRecord } from "./issues/types.js";
export {
  labelsForNewIssue,
  type NewIssuePriority,
  type NewIssueType,
} from "./issues/create-labels.js";
export { draftIssueFromPrompt, type IssueChatDraft } from "./issues/draft-from-prompt.js";
export {
  mapGitHubIssueToCache,
  isPullRequestIssue,
  type GitHubIssuePayload,
} from "./issues/github-issue.js";
export type { BoardColumnId } from "./issues/columns.js";
export {
  boardColumnFromProjectStatus,
  projectStatusNameForColumn,
  projectStatusOptionIdForColumn,
} from "./issues/project-status.js";
export {
  mapGitHubIssueComments,
  formatCommentWhen,
  type IssueDetailComment,
  type GitHubIssueCommentRow,
} from "./issues/comments.js";
export { issueRecordToDetail, type IssueDetailFromCache } from "./issues/detail.js";
export {
  buildBoardSnapshot,
  type BoardSnapshot,
  type BuildBoardSnapshotOptions,
  type IssueCardSyncStatus,
} from "./issues/board-snapshot.js";
export { IssueCacheStore, openIssueCacheStore } from "./issues/store.js";
export {
  IssueSyncConflictStore,
  openIssueSyncConflictStore,
} from "./issues/sync-conflict-store.js";
export type {
  IssueSyncConflictRecord,
  IssueSyncConflictSide,
  SyncConflictField,
  SyncConflictResolutionPicks,
} from "./issues/sync-conflict-types.js";
export {
  applySyncConflictPicks,
  issueSidesDiffer,
  mergeWorkspaceIssuesFromGitHub,
} from "./issues/sync-merge.js";
export {
  slugFromIssueTitle,
  branchNameForIssue,
  worktreeDirectoryName,
} from "./worktree/naming.js";
export type { WorktreeRecord, WorktreeStatus } from "./worktree/types.js";
export { WORKTREE_STATUSES } from "./worktree/types.js";
export {
  workspaceRepoRootKey,
  workspaceWorktreeRootKey,
  defaultWorktreeRootForWorkspace,
} from "./worktree/settings.js";
export {
  parseTrailPreviewConfigYaml,
  previewConfigFromPackageJsonScripts,
  preferredPortFromPreviewUrl,
  previewUrlWithPort,
  type TrailPreviewConfig,
} from "./workspace/trail-preview-config.js";
export { WorktreeStore, openWorktreeStore, worktreeId } from "./worktree/store.js";
export { draftPullRequestBody, draftPullRequestTitle } from "./worktree/draft-pr.js";
export { parseAgentVersionOutput } from "./agent/parse-version.js";
export type { AgentBackendId, AgentBackendStatus } from "./agent/types.js";
export { AGENT_BACKEND_IDS } from "./agent/types.js";
export {
  DEFAULT_PREVIEW_URL,
  normalizePreviewUrl,
  type NormalizePreviewUrlResult,
} from "./preview/normalize-preview-url.js";
export { cssPathForElement, xpathForElement } from "./preview/dom-anchor.js";
export type { PreviewPinAnchor, PreviewPinRecord } from "./preview/pin-types.js";
export { PreviewPinStore, openPreviewPinStore } from "./preview/pin-store.js";
export {
  buildDesignCatalog,
  type DesignScreenDto,
  type DesignVersionDto,
} from "./design/catalog.js";
export {
  KnowledgeDocStore,
  openKnowledgeDocStore,
} from "./knowledge/store.js";
export { slugFromTitle, knowledgeDocId } from "./knowledge/slug.js";
export type { KnowledgeDocRecord, KnowledgeDocSummary } from "./knowledge/types.js";
export {
  DecisionStore,
  openDecisionStore,
} from "./decisions/store.js";
export {
  DecisionConflictStore,
  openDecisionConflictStore,
} from "./decisions/conflict-store.js";
export type { DecisionConflictRecord } from "./decisions/conflict-store.js";
export type { DecisionContentConflict } from "./decisions/conflict-detect.js";
export {
  detectDecisionContentConflicts,
  taskStoreClaimFromMarkdown,
} from "./decisions/conflict-detect.js";
export { refreshDecisionContentConflicts } from "./decisions/reconcile-conflicts.js";
export {
  resolveDecisionContentConflict,
  type DecisionContentConflictResolution,
} from "./decisions/resolve-content-conflict.js";
export {
  releaseDecisionBlock,
  stopDecisionBlockedWorktree,
  syncProposedDecisionBlocks,
} from "./decisions/sync-blocks.js";
export type {
  DecisionRecord,
  DecisionStatus,
  DecisionSummary,
} from "./decisions/types.js";
export {
  formatDecisionMarkdown,
  formatDecisionsBundleMarkdown,
} from "./decisions/markdown.js";
export {
  PERF_BUDGET_COLD_START_MS,
  PERF_BUDGET_WORKSPACE_SWITCH_MS,
  withinPerfBudget,
} from "./diagnostics/perf-budgets.js";
export type { TrailMcpStores } from "./mcp/read-api.js";
export {
  mcpGetDecision,
  mcpGetTask,
  mcpListDecisions,
  mcpListOpenPins,
  mcpListTasks,
  mcpListWorkspaces,
  mcpSearchDocs,
} from "./mcp/read-api.js";
export { mcpCreateDecision } from "./mcp/write-api.js";
export type { McpCreateDecisionInput, McpCreateDecisionResult } from "./mcp/write-api.js";
export { mcpResolvePin } from "./mcp/pins.js";
export type { McpResolvePinInput, McpResolvePinResult } from "./mcp/pins.js";
export { resolveMcpAddTaskComment } from "./mcp/task-comment.js";
export type { McpAddTaskCommentInput, McpAddTaskCommentResult } from "./mcp/task-comment.js";
export { resolveMcpStartAgentRun } from "./mcp/agent-run.js";
export type {
  McpStartAgentRunInput,
  McpStartAgentRunResult,
  McpStopAgentRunInput,
  McpStopAgentRunResult,
} from "./mcp/agent-run.js";
export { resolveMcpStopAgentRun } from "./mcp/agent-run.js";
export {
  assertMcpToolAllowed,
  MCP_WRITE_TOOLS,
  readMcpWorkspaceSettings,
  resolveMcpFlag,
  writeMcpWorkspaceSettings,
  workspaceMcpSettingsKey,
} from "./mcp/settings.js";
export type { McpToolGateResult, McpWorkspaceSettings } from "./mcp/settings.js";
export { resolveMcpUpdateTaskStatus } from "./mcp/task-status.js";
export type {
  McpUpdateTaskStatusInput,
  McpUpdateTaskStatusResult,
} from "./mcp/task-status.js";
export {
  APP_SETTING_AUTOPILOT_GLOBAL_PAUSE,
  DEFAULT_AUTOPILOT_MAX_PARALLEL,
  DEFAULT_AUTOPILOT_PICKUP_LABELS,
  resolveAutopilotEnabled,
  resolveAutopilotGlobalPause,
  resolveAutopilotMaxParallel,
  resolveAutopilotPickupLabels,
  serializeAutopilotPickupLabels,
  workspaceAutopilotEnabledKey,
  workspaceAutopilotMaxParallelKey,
  workspaceAutopilotPickupLabelsKey,
} from "./autopilot/settings.js";
export {
  autopilotQueueBlockedByDecisions,
  issueHasPickupLabel,
  pickAutopilotIssue,
} from "./autopilot/pick-next.js";