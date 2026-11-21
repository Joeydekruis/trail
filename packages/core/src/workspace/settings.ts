/** Keys stored in `app_settings`. */
export const APP_SETTING_GITHUB_LOGIN = "github_login" as const;

export const DEFAULT_PROJECT_STATUS_FIELD = "Status" as const;
export const DEFAULT_SYNC_INTERVAL_SEC = 60 as const;

const MAX_SYNC_INTERVAL_SEC = 86_400;

export function workspaceLastSyncKey(workspaceId: string): string {
  return `workspace:${workspaceId}:last_sync_at`;
}

export function workspaceProjectStatusFieldKey(workspaceId: string): string {
  return `workspace:${workspaceId}:project_status_field`;
}

export function workspaceSyncIntervalKey(workspaceId: string): string {
  return `workspace:${workspaceId}:sync_interval_sec`;
}

export function resolveProjectStatusField(
  stored: string | null | undefined,
): string {
  const trimmed = stored?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_PROJECT_STATUS_FIELD;
}

/** `0` means background sync is off. */
export function resolveSyncIntervalSec(stored: string | null | undefined): number {
  if (!stored?.trim()) {
    return DEFAULT_SYNC_INTERVAL_SEC;
  }
  const parsed = Number.parseInt(stored, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return DEFAULT_SYNC_INTERVAL_SEC;
  }
  return Math.min(parsed, MAX_SYNC_INTERVAL_SEC);
}