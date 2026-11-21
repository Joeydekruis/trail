export type WorkspaceAccent = {
  accent: string;
  accentSoft: string;
  accentLine: string;
  onAccent: string;
};

export type WorkspaceRecord = {
  id: string;
  name: string;
  shortLabel: string;
  repository: string | null;
  integrationBranch: string;
  productionBranch: string;
  sortOrder: number;
} & WorkspaceAccent;