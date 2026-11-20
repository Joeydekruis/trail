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
  githubBoardMappingGet: "github.boardMapping.get",
  githubBoardMappingSet: "github.boardMapping.set",
  boardSnapshot: "board.snapshot",
  boardMoveIssue: "board.moveIssue",
  issueGet: "issue.get",
  issueCreate: "issue.create",
  worktreeList: "worktree.list",
  worktreeCreate: "worktree.create",
  workspaceRepoRootGet: "workspace.repoRoot.get",
  workspaceRepoRootSet: "workspace.repoRoot.set",
  workspaceRepoRootPick: "workspace.repoRoot.pick",
  syncNow: "sync.now",
  windowMinimize: "window.minimize",
  windowMaximize: "window.maximize",
  windowClose: "window.close",
  shellOpenExternal: "shell.openExternal",
  shellOpenPath: "shell.openPath",
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

export const boardColumnId = z.enum([
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
]);

export type BoardColumnIdDto = z.infer<typeof boardColumnId>;

export const boardMoveIssuePayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
  targetColumn: boardColumnId,
});

export type BoardMoveIssuePayload = z.infer<typeof boardMoveIssuePayload>;

export const boardMoveIssueResult = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type BoardMoveIssueResult = z.infer<typeof boardMoveIssueResult>;

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
  error: z.string().optional(),
});

export type GithubListBranchesResult = z.infer<typeof githubListBranchesResult>;

export const githubBoardMappingGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type GithubBoardMappingGetPayload = z.infer<typeof githubBoardMappingGetPayload>;

export const githubBoardMappingGetResult = z.object({
  projectStatusField: z.string().min(1),
  syncIntervalSec: z.number().int().nonnegative(),
});

export type GithubBoardMappingGetResult = z.infer<typeof githubBoardMappingGetResult>;

export const githubBoardMappingSetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  projectStatusField: z.string().min(1).max(64).optional(),
  syncIntervalSec: z.number().int().nonnegative().optional(),
});

export type GithubBoardMappingSetPayload = z.infer<typeof githubBoardMappingSetPayload>;

export const githubBoardMappingSetResult = z.object({
  projectStatusField: z.string().min(1),
  syncIntervalSec: z.number().int().nonnegative(),
});

export type GithubBoardMappingSetResult = z.infer<typeof githubBoardMappingSetResult>;

const newIssueType = z.enum(["feature", "bug", "chore", "docs"]);
const newIssuePriority = z.enum(["urgent", "high", "medium", "low"]);

export const issueCreatePayload = z.object({
  workspaceId: z.string().min(1).optional(),
  title: z.string().min(1).max(256),
  body: z.string().max(65_536),
  type: newIssueType,
  priority: newIssuePriority,
  agentReady: z.boolean().optional(),
});

export type IssueCreatePayload = z.infer<typeof issueCreatePayload>;

export const issueCreateResult = z.union([
  z.object({
    ok: z.literal(true),
    issueNumber: z.number().int().positive(),
    htmlUrl: z.string().url(),
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type IssueCreateResult = z.infer<typeof issueCreateResult>;

export const issueGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
});

export type IssueGetPayload = z.infer<typeof issueGetPayload>;

const issueDetailLabel = z.object({
  text: z.string(),
  tone: z.enum(["blue", "mint", "gray"]),
});

const issueDetailComment = z.object({
  who: z.string(),
  initials: z.string(),
  tone: z.enum(["mint", "blue"]),
  when: z.string(),
  text: z.string(),
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
  comments: z.array(issueDetailComment),
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

export const shellOpenPathPayload = z.object({
  path: z.string().min(1),
});

export type ShellOpenPathPayload = z.infer<typeof shellOpenPathPayload>;

export const shellOpenPathResult = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type ShellOpenPathResult = z.infer<typeof shellOpenPathResult>;

const worktreeStatusDto = z.enum([
  "queued",
  "running",
  "waiting",
  "review",
  "merged",
  "failed",
  "stopped",
]);

export const worktreeDto = z.object({
  id: z.string().min(1),
  issueNumber: z.number().int().positive(),
  title: z.string(),
  branch: z.string().min(1),
  path: z.string().min(1),
  status: worktreeStatusDto,
  isRemote: z.boolean(),
  createdAt: z.string().min(1),
});

export type WorktreeDto = z.infer<typeof worktreeDto>;

export const worktreeListPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type WorktreeListPayload = z.infer<typeof worktreeListPayload>;

export const worktreeListResult = z.object({
  worktrees: z.array(worktreeDto),
  repoRoot: z.string().nullable(),
  worktreeRoot: z.string().nullable(),
});

export type WorktreeListResult = z.infer<typeof worktreeListResult>;

export const worktreeCreatePayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
  title: z.string().min(1).max(256).optional(),
});

export type WorktreeCreatePayload = z.infer<typeof worktreeCreatePayload>;

export const worktreeCreateResult = z.union([
  z.object({
    ok: z.literal(true),
    worktree: worktreeDto,
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type WorktreeCreateResult = z.infer<typeof worktreeCreateResult>;

export const workspaceRepoRootGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type WorkspaceRepoRootGetPayload = z.infer<typeof workspaceRepoRootGetPayload>;

export const workspaceRepoRootGetResult = z.object({
  repoRoot: z.string().nullable(),
  worktreeRoot: z.string().nullable(),
});

export type WorkspaceRepoRootGetResult = z.infer<typeof workspaceRepoRootGetResult>;

export const workspaceRepoRootSetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  repoRoot: z.string().min(1).nullable(),
  worktreeRoot: z.string().min(1).optional(),
});

export type WorkspaceRepoRootSetPayload = z.infer<typeof workspaceRepoRootSetPayload>;

export const workspaceRepoRootSetResult = z.object({
  repoRoot: z.string().nullable(),
  worktreeRoot: z.string(),
  message: z.string().optional(),
});

export type WorkspaceRepoRootSetResult = z.infer<typeof workspaceRepoRootSetResult>;

export const workspaceRepoRootPickResult = z.union([
  z.object({ ok: z.literal(true), path: z.string().min(1) }),
  z.object({ ok: z.literal(false), cancelled: z.literal(true) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type WorkspaceRepoRootPickResult = z.infer<typeof workspaceRepoRootPickResult>;