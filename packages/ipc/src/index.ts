import { z } from "zod";

/** IPC channel ids — extend as main/preload/renderer contract grows. */
export const IpcChannels = {
  workspaceList: "workspace.list",
  workspaceSwitch: "workspace.switch",
  workspaceCreate: "workspace.create",
  githubStatus: "github.status",
  githubSetToken: "github.setToken",
  githubListRepos: "github.listRepos",
  githubListBranches: "github.listBranches",
  githubClearToken: "github.clearToken",
  boardSnapshot: "board.snapshot",
  issueGet: "issue.get",
  syncNow: "sync.now",
  windowMinimize: "window.minimize",
  windowMaximize: "window.maximize",
  windowClose: "window.close",
  shellOpenExternal: "shell.openExternal",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export const workspaceSwitchPayload = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceSwitchPayload = z.infer<typeof workspaceSwitchPayload>;

export const workspaceDto = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  shortLabel: z.string().min(1),
  repository: z.string().nullable(),
  integrationBranch: z.string().min(1),
  productionBranch: z.string().min(1),
  accent: z.string().min(1),
  accentSoft: z.string().min(1),
  accentLine: z.string().min(1),
  onAccent: z.string().min(1),
});

export type WorkspaceDto = z.infer<typeof workspaceDto>;

export const workspaceGithubSnapshot = z.object({
  connected: z.boolean(),
  login: z.string().min(1).optional(),
});

export type WorkspaceGithubSnapshot = z.infer<typeof workspaceGithubSnapshot>;

export const workspaceListResult = z.object({
  workspaces: z.array(workspaceDto),
  activeWorkspaceId: z.string().min(1),
  needsOnboarding: z.boolean(),
  github: workspaceGithubSnapshot,
  activeLastSyncedAt: z.string().nullable(),
});

export type WorkspaceListResult = z.infer<typeof workspaceListResult>;

export const workspaceSwitchResult = z.object({
  active: workspaceDto,
  workspaces: z.array(workspaceDto),
});

export type WorkspaceSwitchResult = z.infer<typeof workspaceSwitchResult>;

export const syncNowPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type SyncNowPayload = z.infer<typeof syncNowPayload>;

export const syncNowResult = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    syncedAt: z.string().min(1),
    issueCount: z.number().int().nonnegative(),
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export const boardSnapshotPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type BoardSnapshotPayload = z.infer<typeof boardSnapshotPayload>;

const boardLabelChip = z.object({
  text: z.string(),
  tone: z.enum(["blue", "mint", "gray", "violet"]),
});

export const boardCardDto = z.object({
  issue: z.string(),
  title: z.string(),
  prioColor: z.string(),
  prioLabel: z.string(),
  labels: z.array(boardLabelChip),
});

export const boardColumnDto = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().int().nonnegative(),
  tone: z.enum(["gray", "blue", "mint", "violet", "amber"]),
  ghLabel: z.string(),
  cards: z.array(boardCardDto),
});

export const boardSnapshotResult = z.object({
  source: z.enum(["cache", "fixture"]),
  repository: z.string().nullable(),
  openCount: z.number().int().nonnegative(),
  columns: z.array(boardColumnDto),
});

export type BoardSnapshotResult = z.infer<typeof boardSnapshotResult>;

export type SyncNowResult = z.infer<typeof syncNowResult>;

export const githubClearTokenResult = z.object({
  cleared: z.literal(true),
});

export type GithubClearTokenResult = z.infer<typeof githubClearTokenResult>;

const repositoryFullName = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/, "Expected owner/repo");

export const workspaceCreatePayload = z.object({
  repository: repositoryFullName,
  name: z.string().min(1).optional(),
  integrationBranch: z.string().min(1).optional(),
  productionBranch: z.string().min(1).optional(),
});

export type WorkspaceCreatePayload = z.infer<typeof workspaceCreatePayload>;

export const workspaceCreateResult = workspaceSwitchResult;

export type WorkspaceCreateResult = z.infer<typeof workspaceCreateResult>;

export const githubSetTokenPayload = z.object({
  token: z.string().min(1),
});

export type GithubSetTokenPayload = z.infer<typeof githubSetTokenPayload>;

export const githubStatusResult = z.object({
  connected: z.boolean(),
  login: z.string().min(1).optional(),
});

export type GithubStatusResult = z.infer<typeof githubStatusResult>;

export const githubSetTokenResult = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), login: z.string().min(1) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type GithubSetTokenResult = z.infer<typeof githubSetTokenResult>;

export const githubRepoDto = z.object({
  fullName: z.string().min(1),
  description: z.string().nullable(),
  openIssuesCount: z.number().int().nonnegative(),
});

export type GithubRepoDto = z.infer<typeof githubRepoDto>;

export const githubListReposResult = z.object({
  repos: z.array(githubRepoDto),
});

export type GithubListReposResult = z.infer<typeof githubListReposResult>;

export const githubListBranchesPayload = z.object({
  repository: repositoryFullName,
});

export type GithubListBranchesPayload = z.infer<typeof githubListBranchesPayload>;

export const githubListBranchesResult = z.object({
  branches: z.array(z.string().min(1)),
});

export type GithubListBranchesResult = z.infer<typeof githubListBranchesResult>;

export const issueGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
});

export type IssueGetPayload = z.infer<typeof issueGetPayload>;

const issueDetailLabel = z.object({
  text: z.string(),
  tone: z.enum(["blue", "mint", "gray"]),
});

export const issueDetailDto = z.object({
  issue: z.string(),
  title: z.string(),
  status: z.string(),
  statusTone: z.enum(["mint", "blue", "gray"]),
  labels: z.array(issueDetailLabel),
  prioLabel: z.string(),
  prioColor: z.string(),
  by: z.string(),
  adr: z.string(),
  pr: z.string(),
  syncLabel: z.string(),
  desc: z.string(),
  steps: z.array(z.object({ text: z.string(), done: z.boolean() })),
  nComments: z.number().int().nonnegative(),
  comments: z.array(z.unknown()),
  activity: z.array(z.unknown()),
  cta: z.string(),
  htmlUrl: z.string().url(),
});

export type IssueDetailDto = z.infer<typeof issueDetailDto>;

export const issueGetResult = z.union([
  z.object({ found: z.literal(true), detail: issueDetailDto }),
  z.object({ found: z.literal(false) }),
]);

export type IssueGetResult = z.infer<typeof issueGetResult>;

export const shellOpenExternalPayload = z.object({
  url: z.string().url(),
});

export type ShellOpenExternalPayload = z.infer<typeof shellOpenExternalPayload>;