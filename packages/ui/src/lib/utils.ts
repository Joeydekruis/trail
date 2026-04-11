export function relativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

export function acceptanceCriteriaProgress(
  criteria: string[] | undefined,
): { done: number; total: number; percent: number } | null {
  if (!criteria || criteria.length === 0) return null;
  const total = criteria.length;
  const done = criteria.filter(
    (c) => c.startsWith("[x]") || c.startsWith("[X]"),
  ).length;
  const percent = Math.round((done / total) * 100);
  return { done, total, percent };
}
