export type IssueDetailComment = {
  who: string;
  initials: string;
  tone: "mint" | "blue";
  when: string;
  text: string;
};

export type GitHubIssueCommentRow = {
  user: { login: string } | null;
  body: string;
  created_at: string;
};

function initialsFromLogin(login: string): string {
  const trimmed = login.trim();
  if (trimmed.length <= 2) {
    return trimmed.toUpperCase();
  }
  const parts = trimmed.split(/[-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/** Short relative label for comment timestamps (e.g. "2h ago"). */
export function formatCommentWhen(iso: string, now = Date.now()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return iso;
  }
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 14) {
    return `${days}d ago`;
  }
  return new Date(then).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapGitHubIssueComments(rows: GitHubIssueCommentRow[]): IssueDetailComment[] {
  return rows.map((row, index) => {
    const who = row.user?.login?.trim() || "ghost";
    return {
      who,
      initials: initialsFromLogin(who),
      tone: index % 2 === 0 ? "mint" : "blue",
      when: formatCommentWhen(row.created_at),
      text: row.body?.trim() || "",
    };
  });
}