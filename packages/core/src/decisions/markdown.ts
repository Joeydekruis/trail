import type { DecisionRecord } from "./types.js";

export type DecisionMarkdownInput = Pick<
  DecisionRecord,
  | "adrId"
  | "title"
  | "status"
  | "author"
  | "updatedAt"
  | "contextMarkdown"
  | "decisionMarkdown"
  | "consequencesMarkdown"
  | "blocksIssueNumber"
>;

function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Standard ADR markdown for export (one decision). */
export function formatDecisionMarkdown(decision: DecisionMarkdownInput): string {
  const lines = [
    `# ${decision.adrId}: ${decision.title}`,
    "",
    `**Status:** ${capitalizeStatus(decision.status)}`,
    `**Author:** ${decision.author}`,
    `**Updated:** ${decision.updatedAt}`,
  ];
  if (decision.blocksIssueNumber != null) {
    lines.push(`**Blocks issue:** #${decision.blocksIssueNumber}`);
  }
  lines.push("", "## Context", "", decision.contextMarkdown.trim(), "", "## Decision", "", decision.decisionMarkdown.trim());
  if (decision.consequencesMarkdown.trim()) {
    lines.push("", "## Consequences", "", decision.consequencesMarkdown.trim());
  }
  return `${lines.join("\n")}\n`;
}

/** Concatenate multiple ADRs with horizontal rules (workspace export). */
export function formatDecisionsBundleMarkdown(decisions: DecisionMarkdownInput[]): string {
  return decisions.map((row) => formatDecisionMarkdown(row)).join("\n---\n\n");
}