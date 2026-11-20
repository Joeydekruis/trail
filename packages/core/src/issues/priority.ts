export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";

const PRIORITY_ORDER: Record<IssuePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

export type PriorityDisplay = {
  priority: IssuePriority;
  label: string;
  color: string;
};

const DISPLAY: Record<IssuePriority, Omit<PriorityDisplay, "priority">> = {
  urgent: { label: "Urgent", color: "var(--red)" },
  high: { label: "High", color: "var(--amber)" },
  medium: { label: "Medium", color: "var(--blue)" },
  low: { label: "Low", color: "var(--ink-muted)" },
  none: { label: "Not set", color: "var(--ink-muted)" },
};

/** Reads `priority:*` labels from GitHub issue labels. */
export function priorityFromLabelNames(names: readonly string[]): IssuePriority {
  for (const name of names) {
    const match = /^priority:(urgent|high|medium|low)$/i.exec(name.trim());
    if (match) {
      return match[1].toLowerCase() as IssuePriority;
    }
  }
  return "none";
}

export function priorityDisplay(priority: IssuePriority): PriorityDisplay {
  const row = DISPLAY[priority];
  return { priority, ...row };
}

export function compareByPriority(a: IssuePriority, b: IssuePriority): number {
  return PRIORITY_ORDER[a] - PRIORITY_ORDER[b];
}