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
  worktreeSetStatus: "worktree.setStatus",
  agentStatus: "agent.status",
  agentRunStart: "agent.runStart",
  agentRunStop: "agent.runStop",
  autopilotGet: "autopilot.get",
  autopilotSet: "autopilot.set",
  previewAttach: "preview.attach",
  previewSetBounds: "preview.setBounds",
  previewDetach: "preview.detach",
  previewEnsureDevServer: "preview.ensureDevServer",
  previewNavigate: "preview.navigate",
  previewCommentMode: "preview.commentMode",
  previewPinSubmit: "preview.pinSubmit",
  previewE2eSimulatePin: "preview.e2eSimulatePin",
  designList: "design.list",
  designPreviewUrl: "design.previewUrl",
  knowledgeDocList: "knowledge.doc.list",
  knowledgeDocGet: "knowledge.doc.get",
  knowledgeDocSave: "knowledge.doc.save",
  decisionList: "decision.list",
  decisionGet: "decision.get",
  decisionAccept: "decision.accept",
  decisionReject: "decision.reject",
  decisionCreate: "decision.create",
  decisionExportMarkdown: "decision.exportMarkdown",
  workspaceRepoRootGet: "workspace.repoRoot.get",
  workspaceRepoRootSet: "workspace.repoRoot.set",
  workspaceRepoRootPick: "workspace.repoRoot.pick",
  syncNow: "sync.now",
  windowMinimize: "window.minimize",
  windowMaximize: "window.maximize",
  windowClose: "window.close",
  shellOpenExternal: "shell.openExternal",
  shellOpenPath: "shell.openPath",
  diagnosticsGetSnapshot: "diagnostics.getSnapshot",
  diagnosticsMarkRendererReady: "diagnostics.markRendererReady",
  diagnosticsReportWorkspaceSwitch: "diagnostics.reportWorkspaceSwitch",
  mcpConnection: "mcp.connection",
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

export const worktreeSetStatusPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
  status: worktreeStatusDto,
});

export type WorktreeSetStatusPayload = z.infer<typeof worktreeSetStatusPayload>;

export const worktreeSetStatusResult = z.union([
  z.object({
    ok: z.literal(true),
    worktree: worktreeDto,
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type WorktreeSetStatusResult = z.infer<typeof worktreeSetStatusResult>;

const agentBackendId = z.enum(["cursor", "claude"]);

export const agentBackendStatusDto = z.object({
  id: agentBackendId,
  binary: z.string().min(1),
  found: z.boolean(),
  version: z.string().nullable(),
});

export type AgentBackendStatusDto = z.infer<typeof agentBackendStatusDto>;

export const agentStatusResult = z.object({
  backends: z.array(agentBackendStatusDto),
});

export type AgentStatusResult = z.infer<typeof agentStatusResult>;

export const agentRunStartPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
  prompt: z.string().max(4000).optional(),
});

export type AgentRunStartPayload = z.infer<typeof agentRunStartPayload>;

export const agentRunStartResult = z.union([
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type AgentRunStartResult = z.infer<typeof agentRunStartResult>;

export const agentRunStopPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  issueNumber: z.number().int().positive(),
});

export type AgentRunStopPayload = z.infer<typeof agentRunStopPayload>;

export const agentRunStopResult = z.object({
  stopped: z.boolean(),
});

export type AgentRunStopResult = z.infer<typeof agentRunStopResult>;

export const autopilotGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export const autopilotGetResult = z.object({
  workspaceId: z.string().min(1),
  enabled: z.boolean(),
  globallyPaused: z.boolean(),
  queueBlocked: z.boolean(),
  maxParallel: z.number().int().min(1).max(5),
  pickupLabels: z.array(z.string().min(1)),
});

export type AutopilotGetResult = z.infer<typeof autopilotGetResult>;

export const autopilotSetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  globallyPaused: z.boolean().optional(),
  maxParallel: z.number().int().min(1).max(5).optional(),
  pickupLabels: z.array(z.string().min(1)).optional(),
});

export type AutopilotSetPayload = z.infer<typeof autopilotSetPayload>;

export const autopilotSetResult = autopilotGetResult;

export type AutopilotSetResult = z.infer<typeof autopilotSetResult>;

export const previewWorktreeRef = z.object({
  workspaceId: z.string().min(1),
  issueNumber: z.number().int().positive(),
});

export type PreviewWorktreeRef = z.infer<typeof previewWorktreeRef>;

export const previewAttachPayload = previewWorktreeRef.extend({
  url: z.string().min(1).optional(),
});

export type PreviewAttachPayload = z.infer<typeof previewAttachPayload>;

export const previewAttachResult = z.union([
  z.object({ ok: z.literal(true), url: z.string().url() }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type PreviewAttachResult = z.infer<typeof previewAttachResult>;

export const previewSetBoundsPayload = previewWorktreeRef.extend({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().finite().nonnegative(),
  height: z.number().finite().nonnegative(),
});

export type PreviewSetBoundsPayload = z.infer<typeof previewSetBoundsPayload>;

export const previewDetachPayload = previewWorktreeRef;

export type PreviewDetachPayload = z.infer<typeof previewDetachPayload>;

export const previewEnsureDevServerPayload = previewWorktreeRef;

export type PreviewEnsureDevServerPayload = z.infer<typeof previewEnsureDevServerPayload>;

export const previewEnsureDevServerResult = z.union([
  z.object({
    ok: z.literal(true),
    url: z.string().url(),
    started: z.boolean(),
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type PreviewEnsureDevServerResult = z.infer<typeof previewEnsureDevServerResult>;

export const previewNavigatePayload = previewWorktreeRef.extend({
  url: z.string().min(1),
});

export type PreviewNavigatePayload = z.infer<typeof previewNavigatePayload>;

export const previewNavigateResult = previewAttachResult;

export type PreviewNavigateResult = z.infer<typeof previewNavigateResult>;

export const previewPinAnchorDto = z.object({
  selector: z.string().min(1),
  xpath: z.string().min(1),
  elementText: z.string(),
  offsetX: z.number().finite(),
  offsetY: z.number().finite(),
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
  pageUrl: z.string().url(),
});

export type PreviewPinAnchorDto = z.infer<typeof previewPinAnchorDto>;

export const previewCommentModePayload = previewWorktreeRef.extend({
  enabled: z.boolean(),
});

export type PreviewCommentModePayload = z.infer<typeof previewCommentModePayload>;

export const previewPinSubmitPayload = z.object({
  comment: z.string().min(1).max(4000),
  anchor: previewPinAnchorDto,
});

export type PreviewPinSubmitPayload = z.infer<typeof previewPinSubmitPayload>;

export const previewPinSubmitResult = z.union([
  z.object({ ok: z.literal(true), pinNumber: z.number().int().positive() }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type PreviewPinSubmitResult = z.infer<typeof previewPinSubmitResult>;

export const previewE2eSimulatePinPayload = previewWorktreeRef.extend({
  comment: z.string().min(1).max(4000),
  anchor: previewPinAnchorDto.partial().optional(),
});

export type PreviewE2eSimulatePinPayload = z.infer<typeof previewE2eSimulatePinPayload>;

export const previewPinEventDto = z.object({
  workspaceId: z.string().min(1),
  issueNumber: z.number().int().positive(),
  pinNumber: z.number().int().positive(),
  comment: z.string().min(1),
  pageUrl: z.string().url(),
  selector: z.string().min(1),
  elementText: z.string(),
  offsetX: z.number().finite(),
  offsetY: z.number().finite(),
});

export type PreviewPinEventDto = z.infer<typeof previewPinEventDto>;

export const designVersionDto = z.object({
  version: z.string().min(1),
  relativePath: z.string().min(1),
});

export const designScreenDto = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  versions: z.array(designVersionDto),
});

export type DesignScreenDto = z.infer<typeof designScreenDto>;

export const designListPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type DesignListPayload = z.infer<typeof designListPayload>;

export const designListResult = z.object({
  designRoot: z.string().nullable(),
  screens: z.array(designScreenDto),
});

export type DesignListResult = z.infer<typeof designListResult>;

export const designPreviewUrlPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  relativePath: z.string().min(1),
});

export type DesignPreviewUrlPayload = z.infer<typeof designPreviewUrlPayload>;

export const designPreviewUrlResult = z.union([
  z.object({ ok: z.literal(true), url: z.string().url() }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type DesignPreviewUrlResult = z.infer<typeof designPreviewUrlResult>;

export const knowledgeDocSummaryDto = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type KnowledgeDocSummaryDto = z.infer<typeof knowledgeDocSummaryDto>;

export const knowledgeDocDto = knowledgeDocSummaryDto.extend({
  bodyMarkdown: z.string(),
});

export type KnowledgeDocDto = z.infer<typeof knowledgeDocDto>;

export const knowledgeDocListPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type KnowledgeDocListPayload = z.infer<typeof knowledgeDocListPayload>;

export const knowledgeDocListResult = z.object({
  docs: z.array(knowledgeDocSummaryDto),
});

export type KnowledgeDocListResult = z.infer<typeof knowledgeDocListResult>;

export const knowledgeDocGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  slug: z.string().min(1),
});

export type KnowledgeDocGetPayload = z.infer<typeof knowledgeDocGetPayload>;

export const knowledgeDocGetResult = z.union([
  z.object({ ok: z.literal(true), doc: knowledgeDocDto }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type KnowledgeDocGetResult = z.infer<typeof knowledgeDocGetResult>;

export const knowledgeDocSavePayload = z.object({
  workspaceId: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  bodyMarkdown: z.string().max(200_000),
});

export type KnowledgeDocSavePayload = z.infer<typeof knowledgeDocSavePayload>;

export const knowledgeDocSaveResult = z.object({
  doc: knowledgeDocDto,
});

export type KnowledgeDocSaveResult = z.infer<typeof knowledgeDocSaveResult>;

export const decisionStatusDto = z.enum([
  "proposed",
  "accepted",
  "superseded",
  "rejected",
]);

export type DecisionStatusDto = z.infer<typeof decisionStatusDto>;

export const decisionSummaryDto = z.object({
  adrId: z.string().min(1),
  title: z.string().min(1),
  status: decisionStatusDto,
  author: z.string().min(1),
  updatedAt: z.string().min(1),
  blocksIssueNumber: z.number().int().positive().nullable(),
});

export type DecisionSummaryDto = z.infer<typeof decisionSummaryDto>;

export const decisionDetailDto = decisionSummaryDto.extend({
  contextMarkdown: z.string(),
  decisionMarkdown: z.string(),
  consequencesMarkdown: z.string(),
  blockedIssueTitle: z.string().nullable(),
});

export type DecisionDetailDto = z.infer<typeof decisionDetailDto>;

export const decisionListPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type DecisionListPayload = z.infer<typeof decisionListPayload>;

export const decisionListResult = z.object({
  decisions: z.array(decisionSummaryDto),
});

export type DecisionListResult = z.infer<typeof decisionListResult>;

export const decisionGetPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  adrId: z.string().min(1),
});

export type DecisionGetPayload = z.infer<typeof decisionGetPayload>;

export const decisionGetResult = z.union([
  z.object({ ok: z.literal(true), decision: decisionDetailDto }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type DecisionGetResult = z.infer<typeof decisionGetResult>;

export const decisionAcceptPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  adrId: z.string().min(1),
});

export type DecisionAcceptPayload = z.infer<typeof decisionAcceptPayload>;

export const decisionAcceptResult = z.union([
  z.object({ ok: z.literal(true), decision: decisionDetailDto }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type DecisionAcceptResult = z.infer<typeof decisionAcceptResult>;

export const decisionRejectPayload = decisionAcceptPayload;

export type DecisionRejectPayload = z.infer<typeof decisionRejectPayload>;

export const decisionRejectResult = decisionAcceptResult;

export type DecisionRejectResult = z.infer<typeof decisionRejectResult>;

export const decisionCreatePayload = z.object({
  workspaceId: z.string().min(1).optional(),
  title: z.string().min(1).max(200),
  contextMarkdown: z.string().min(1).max(50_000),
  decisionMarkdown: z.string().min(1).max(50_000),
  consequencesMarkdown: z.string().max(50_000).optional(),
  blocksIssueNumber: z.number().int().positive().optional(),
  status: z.enum(["proposed", "accepted"]).optional(),
});

export type DecisionCreatePayload = z.infer<typeof decisionCreatePayload>;

export const decisionCreateResult = z.union([
  z.object({ ok: z.literal(true), decision: decisionDetailDto }),
  z.object({
    ok: z.literal(false),
    message: z.string().min(1),
    code: z.enum(["conflict", "validation"]).optional(),
    existingAdrId: z.string().optional(),
  }),
]);

export type DecisionCreateResult = z.infer<typeof decisionCreateResult>;

export const decisionExportMarkdownPayload = z.object({
  workspaceId: z.string().min(1).optional(),
  adrId: z.string().min(1).optional(),
});

export type DecisionExportMarkdownPayload = z.infer<typeof decisionExportMarkdownPayload>;

export const decisionExportMarkdownResult = z.union([
  z.object({
    ok: z.literal(true),
    filename: z.string().min(1),
    markdown: z.string(),
  }),
  z.object({ ok: z.literal(false), message: z.string().min(1) }),
]);

export type DecisionExportMarkdownResult = z.infer<typeof decisionExportMarkdownResult>;

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

export const diagnosticsMarkRendererReadyPayload = z.object({
  at: z.number().finite().optional(),
});

export type DiagnosticsMarkRendererReadyPayload = z.infer<
  typeof diagnosticsMarkRendererReadyPayload
>;

export const diagnosticsReportWorkspaceSwitchPayload = z.object({
  durationMs: z.number().finite().nonnegative(),
  openViewCount: z.number().int().nonnegative().optional(),
});

export type DiagnosticsReportWorkspaceSwitchPayload = z.infer<
  typeof diagnosticsReportWorkspaceSwitchPayload
>;

export const diagnosticsProcessMetricDto = z.object({
  type: z.string(),
  cpu: z.number(),
  memoryMb: z.number(),
});

export type DiagnosticsProcessMetricDto = z.infer<typeof diagnosticsProcessMetricDto>;

export const diagnosticsGetSnapshotPayload = z.object({
  openViewCount: z.number().int().nonnegative().optional(),
});

export type DiagnosticsGetSnapshotPayload = z.infer<typeof diagnosticsGetSnapshotPayload>;

export const diagnosticsGetSnapshotResult = z.object({
  collectedAt: z.string().datetime({ offset: true }),
  startup: z.object({
    appReadyAt: z.number().nullable(),
    windowShownAt: z.number().nullable(),
    rendererReadyAt: z.number().nullable(),
    coldStartMs: z.number().nullable(),
    lastWorkspaceSwitchMs: z.number().nullable(),
  }),
  sqlitePath: z.string().nullable(),
  sqliteBytes: z.number().int().nonnegative().nullable(),
  workspacesCount: z.number().int().nonnegative(),
  activeWorkspaceId: z.string().min(1),
  openIssueCount: z.number().int().nonnegative(),
  openViewCount: z.number().int().nonnegative().nullable(),
  processes: z.array(diagnosticsProcessMetricDto),
});

export type DiagnosticsGetSnapshotResult = z.infer<typeof diagnosticsGetSnapshotResult>;

export const mcpConnectionResult = z.object({
  running: z.boolean(),
  baseUrl: z.string().nullable(),
  token: z.string().nullable(),
  connectionFile: z.string().min(1),
  stdioCommand: z.string().min(1),
  cursorConfigJson: z.string().min(2),
});

export type McpConnectionResult = z.infer<typeof mcpConnectionResult>;