/**
 * Browser-safe `@trail/core` surface for the Electron renderer.
 * Do not import Node-only modules here (path, fs, child_process, etc.).
 */

export {
  DEFAULT_PROJECT_STATUS_FIELD,
  DEFAULT_SYNC_INTERVAL_SEC,
} from "./workspace/settings.js";
export {
  GITHUB_NOT_REACHABLE_MESSAGE,
  isGitHubUnreachableError,
} from "./github/sync-error.js";
export {
  DEFAULT_AUTOPILOT_MAX_PARALLEL,
  DEFAULT_AUTOPILOT_PICKUP_LABELS,
} from "./autopilot/settings.js";
export { formatWorkspaceRepoLine } from "./workspace/format.js";
export {
  draftIssueFromPrompt,
  type IssueChatDraft,
} from "./issues/draft-from-prompt.js";
export {
  DEFAULT_PREVIEW_URL,
  normalizePreviewUrl,
  type NormalizePreviewUrlResult,
} from "./preview/normalize-preview-url.js";
export { BOARD_COLUMN_META } from "./issues/columns.js";