import type { IssueCacheStore } from "../issues/store.js";
import type { DecisionStore } from "../decisions/store.js";
import type { KnowledgeDocStore } from "../knowledge/store.js";
import type { PreviewPinStore } from "../preview/pin-store.js";
import type { WorkspaceStore } from "../workspace/store.js";
import { decisionIdFromDoc, isDecisionDoc } from "./decisions.js";

export type TrailMcpStores = {
  workspaces: WorkspaceStore;
  issues: IssueCacheStore;
  knowledge: KnowledgeDocStore;
  decisions: DecisionStore;
  pins: PreviewPinStore;
};

export type McpWorkspaceRow = {
  id: string;
  name: string;
  repository: string | null;
  active: boolean;
};

export type McpTaskRow = {
  number: number;
  id: string;
  title: string;
  state: string;
  boardColumn: string;
  priority: string;
  labels: string[];
  htmlUrl: string;
  updatedAt: string;
};

export type McpDecisionRow = {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
};

export type McpDocSearchHit = {
  slug: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

function resolveWorkspaceId(stores: TrailMcpStores, workspaceId?: string): string {
  const trimmed = workspaceId?.trim();
  if (trimmed) {
    return trimmed;
  }
  return stores.workspaces.getActiveId();
}

export function mcpListWorkspaces(stores: TrailMcpStores): McpWorkspaceRow[] {
  const activeId = stores.workspaces.getActiveId();
  return stores.workspaces.list().map((ws) => ({
    id: ws.id,
    name: ws.name,
    repository: ws.repository,
    active: ws.id === activeId,
  }));
}

export function mcpListTasks(stores: TrailMcpStores, workspaceId?: string): McpTaskRow[] {
  const id = resolveWorkspaceId(stores, workspaceId);
  return stores.issues.listByWorkspace(id).map((issue) => ({
    number: issue.number,
    id: `#${issue.number}`,
    title: issue.title,
    state: issue.state,
    boardColumn: issue.boardColumn,
    priority: issue.priority,
    labels: issue.labels,
    htmlUrl: issue.htmlUrl,
    updatedAt: issue.updatedAt,
  }));
}

export function mcpGetTask(
  stores: TrailMcpStores,
  input: { workspaceId?: string; number?: number; id?: string },
): (McpTaskRow & { body: string | null }) | null {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  let issueNumber = input.number;
  if (issueNumber === undefined && input.id?.trim()) {
    const match = /^#?(\d+)$/.exec(input.id.trim());
    issueNumber = match ? Number.parseInt(match[1], 10) : undefined;
  }
  if (issueNumber === undefined || !Number.isFinite(issueNumber)) {
    return null;
  }
  const issue = stores.issues.get(workspaceId, issueNumber);
  if (!issue) {
    return null;
  }
  return {
    number: issue.number,
    id: `#${issue.number}`,
    title: issue.title,
    state: issue.state,
    boardColumn: issue.boardColumn,
    priority: issue.priority,
    labels: issue.labels,
    htmlUrl: issue.htmlUrl,
    updatedAt: issue.updatedAt,
    body: issue.body,
  };
}

function decisionBodyMarkdown(input: {
  contextMarkdown: string;
  decisionMarkdown: string;
  consequencesMarkdown: string;
}): string {
  const parts = [
    `# Context\n${input.contextMarkdown}`,
    `# Decision\n${input.decisionMarkdown}`,
  ];
  if (input.consequencesMarkdown.trim()) {
    parts.push(`# Consequences\n${input.consequencesMarkdown}`);
  }
  return parts.join("\n\n");
}

export function mcpListDecisions(
  stores: TrailMcpStores,
  workspaceId?: string,
): McpDecisionRow[] {
  const id = resolveWorkspaceId(stores, workspaceId);
  const tableRows = stores.decisions.list(id);
  const tableIds = new Set(tableRows.map((row) => row.adrId));
  const fromTable = tableRows.map((row) => ({
    id: row.adrId,
    slug: row.adrId.toLowerCase(),
    title: row.title,
    updatedAt: row.updatedAt,
  }));
  const legacy = stores.knowledge
    .list(id)
    .filter((doc) => isDecisionDoc(doc.slug, doc.title))
    .filter((doc) => !tableIds.has(decisionIdFromDoc(doc)))
    .map((doc) => ({
      id: decisionIdFromDoc(doc),
      slug: doc.slug,
      title: doc.title,
      updatedAt: doc.updatedAt,
    }));
  return [...fromTable, ...legacy];
}

export function mcpGetDecision(
  stores: TrailMcpStores,
  input: { workspaceId?: string; id: string },
):
  | {
      id: string;
      slug: string;
      title: string;
      bodyMarkdown: string;
      updatedAt: string;
    }
  | null {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const key = input.id.trim();
  const fromTable = stores.decisions.get(workspaceId, key);
  if (fromTable) {
    return {
      id: fromTable.adrId,
      slug: fromTable.adrId.toLowerCase(),
      title: fromTable.title,
      bodyMarkdown: decisionBodyMarkdown(fromTable),
      updatedAt: fromTable.updatedAt,
    };
  }
  const docs = stores.knowledge.list(workspaceId);
  for (const summary of docs) {
    if (!isDecisionDoc(summary.slug, summary.title)) {
      continue;
    }
    const decisionId = decisionIdFromDoc(summary);
    if (decisionId.toLowerCase() !== key.toLowerCase() && summary.slug !== key) {
      continue;
    }
    const full = stores.knowledge.get(workspaceId, summary.slug);
    if (!full) {
      return null;
    }
    return {
      id: decisionIdFromDoc(full),
      slug: full.slug,
      title: full.title,
      bodyMarkdown: full.bodyMarkdown,
      updatedAt: full.updatedAt,
    };
  }
  return null;
}

export function mcpSearchDocs(
  stores: TrailMcpStores,
  input: { workspaceId?: string; query: string; limit?: number },
): McpDocSearchHit[] {
  const workspaceId = resolveWorkspaceId(stores, input.workspaceId);
  const q = input.query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 50);
  const hits: McpDocSearchHit[] = [];
  for (const summary of stores.knowledge.list(workspaceId)) {
    const doc = stores.knowledge.get(workspaceId, summary.slug);
    if (!doc) {
      continue;
    }
    const haystack = `${doc.title}\n${doc.bodyMarkdown}`.toLowerCase();
    const index = haystack.indexOf(q);
    if (index < 0) {
      continue;
    }
    const start = Math.max(0, index - 40);
    const excerpt = doc.bodyMarkdown.slice(start, start + 120).replace(/\s+/g, " ").trim();
    hits.push({
      slug: doc.slug,
      title: doc.title,
      excerpt,
      updatedAt: doc.updatedAt,
    });
    if (hits.length >= limit) {
      break;
    }
  }
  return hits;
}

export function mcpListOpenPins(
  stores: TrailMcpStores,
  workspaceId?: string,
  issueNumber?: number,
): Array<{
  id: number;
  issueNumber: number;
  pinNumber: number;
  comment: string;
  pageUrl: string;
  createdAt: string;
}> {
  const id = resolveWorkspaceId(stores, workspaceId);
  const pins = issueNumber
    ? stores.pins.list(id, issueNumber)
    : stores.pins.listByWorkspace(id);
  return pins.map((pin) => ({
    id: pin.id,
    issueNumber: pin.issueNumber,
    pinNumber: pin.pinNumber,
    comment: pin.comment,
    pageUrl: pin.anchor.pageUrl,
    createdAt: pin.createdAt,
  }));
}