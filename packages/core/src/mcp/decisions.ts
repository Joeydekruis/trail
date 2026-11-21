import type { KnowledgeDocRecord, KnowledgeDocSummary } from "../knowledge/types.js";

/** Whether a knowledge doc is surfaced as a Trail decision (ADR) in MCP. */
export function isDecisionDoc(slug: string, title: string): boolean {
  if (slug.toLowerCase().startsWith("adr")) {
    return true;
  }
  return /^adr[-\s]/i.test(title.trim());
}

export function decisionIdFromDoc(doc: KnowledgeDocSummary | KnowledgeDocRecord): string {
  const fromTitle = /^ADR-\d+/i.exec(doc.title.trim());
  if (fromTitle) {
    return fromTitle[0].toUpperCase();
  }
  return doc.slug;
}