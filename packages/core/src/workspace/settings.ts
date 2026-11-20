/** Keys stored in `app_settings`. */
export const APP_SETTING_GITHUB_LOGIN = "github_login" as const;

export const DEFAULT_PROJECT_STATUS_FIELD = "Status" as const;

export function workspaceLastSyncKey(workspaceId: string): string {
  return `workspace:${workspaceId}:last_sync_at`;
}

export function workspaceProjectStatusFieldKey(workspaceId: string): string {
  return `workspace:${workspaceId}:project_status_field`;
}

export function resolveProjectStatusField(
  stored: string | null | undefined,
): string {
  const trimmed = stored?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : DEFAULT_PROJECT_STATUS_FIELD;
}