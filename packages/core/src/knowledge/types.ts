export type KnowledgeDocRecord = {
  id: string;
  workspaceId: string;
  slug: string;
  title: string;
  bodyMarkdown: string;
  updatedAt: string;
};

export type KnowledgeDocSummary = {
  slug: string;
  title: string;
  updatedAt: string;
};