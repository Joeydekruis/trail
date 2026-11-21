export type NewIssueType = "feature" | "bug" | "chore" | "docs";
export type NewIssuePriority = "urgent" | "high" | "medium" | "low";

export function labelsForNewIssue(input: {
  type: NewIssueType;
  priority: NewIssuePriority;
  agentReady?: boolean;
}): string[] {
  const labels = [input.type, `priority:${input.priority}`];
  if (input.agentReady) {
    labels.push("agent-ready");
  }
  return labels;
}