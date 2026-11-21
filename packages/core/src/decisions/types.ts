export const DECISION_STATUSES = [
  "proposed",
  "accepted",
  "superseded",
  "rejected",
] as const;

export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export type DecisionRecord = {
  id: string;
  workspaceId: string;
  adrId: string;
  title: string;
  status: DecisionStatus;
  contextMarkdown: string;
  decisionMarkdown: string;
  consequencesMarkdown: string;
  author: string;
  blocksIssueNumber: number | null;
  updatedAt: string;
};

export type DecisionSummary = {
  adrId: string;
  title: string;
  status: DecisionStatus;
  author: string;
  updatedAt: string;
  blocksIssueNumber: number | null;
};