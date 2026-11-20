/** Keys stored in `app_settings`. */
export const APP_SETTING_GITHUB_LOGIN = "github_login" as const;

export function workspaceLastSyncKey(workspaceId: string): string {
  return `workspace:${workspaceId}:last_sync_at`;
}