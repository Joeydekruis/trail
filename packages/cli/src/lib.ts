/**
 * Stable imports for `@trail-pm/ui` and other integrations that share Trail core logic.
 */
export { findTrailRoot, trailPaths, type TrailPaths } from "./core/paths.js";
export {
  loadAllTasks,
  findTaskFileById,
  writeTaskFile,
} from "./core/task-store.js";
export { rebuildSnapshot } from "./core/rebuild-snapshot.js";
export { generateDraftId } from "./core/draft-id.js";
export { TaskSchema, type Task } from "./schemas/task.js";
export { TrailConfigSchema, type TrailConfig } from "./schemas/config.js";
export { resolveGitHubToken } from "./core/auth.js";
export { GitHubClient } from "./core/github-client.js";
export { issueToTask, taskToIssueUpdate } from "./core/github-mapper.js";
export { fullSync, pullSync, type SyncProgress } from "./core/sync.js";
export { writeLastFullSyncAt } from "./core/config-update.js";
export { linkDraftToNewGitHubIssue } from "./core/link-draft-issue.js";
