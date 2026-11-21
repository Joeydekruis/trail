/** Background GitHub sync when the app window is not focused (performance briefing). */
export const UNFOCUSED_BACKGROUND_SYNC_SEC = 300 as const;

export function resolveBackgroundSyncIntervalSec(
  configuredSec: number,
  focused: boolean,
  powerSuspended: boolean,
): number | null {
  if (powerSuspended) {
    return null;
  }
  if (configuredSec === 0) {
    return null;
  }
  if (focused) {
    return configuredSec;
  }
  return UNFOCUSED_BACKGROUND_SYNC_SEC;
}