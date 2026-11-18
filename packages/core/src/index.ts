/** Desktop domain layer — sync, worktrees, config. Migrate logic from @trail-pm/cli over time. */

export const TRAIL_CORE_VERSION = "0.0.0" as const;

export type { SqliteDatabase, SqliteStatement } from "./db/types.js";
export type { WorkspaceAccent, WorkspaceRecord } from "./workspace/types.js";
export { WorkspaceStore, openWorkspaceStore } from "./workspace/store.js";