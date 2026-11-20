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
export { buildBoardSnapshot, type BoardSnapshot } from "./issues/board-snapshot.js";
export { IssueCacheStore, openIssueCacheStore } from "./issues/store.js";