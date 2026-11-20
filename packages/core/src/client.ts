/**
 * Browser-safe `@trail/core` surface for the Electron renderer.
 * Do not import Node-only modules here (path, fs, child_process, etc.).
 */

export {
  DEFAULT_PROJECT_STATUS_FIELD,
  DEFAULT_SYNC_INTERVAL_SEC,
} from "./workspace/settings.js";
export { formatWorkspaceRepoLine } from "./workspace/format.js";
export {
  draftIssueFromPrompt,
  type IssueChatDraft,
} from "./issues/draft-from-prompt.js";