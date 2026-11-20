export function formatSyncLabel(syncedAt: string | null | undefined): string {
  if (!syncedAt) {
    return "Never synced";
  }
  const then = new Date(syncedAt).getTime();
  if (Number.isNaN(then)) {
    return "Never synced";
  }
  const minutes = Math.floor((Date.now() - then) / 60_000);
  if (minutes < 1) {
    return "Synced just now";
  }
  if (minutes < 60) {
    return `Synced ${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Synced ${hours} hr ago`;
  }
  return `Synced ${Math.floor(hours / 24)} day ago`;
}