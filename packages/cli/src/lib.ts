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
export { TrailConfigSchema } from "./schemas/config.js";
