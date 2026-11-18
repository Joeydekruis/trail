import { z } from "zod";

/** IPC channel ids — extend as main/preload/renderer contract grows. */
export const IpcChannels = {
  workspaceList: "workspace.list",
  workspaceSwitch: "workspace.switch",
  syncNow: "sync.now",
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
  accent: z.string().min(1),
  accentSoft: z.string().min(1),
  accentLine: z.string().min(1),
  onAccent: z.string().min(1),
});

export type WorkspaceDto = z.infer<typeof workspaceDto>;

export const workspaceListResult = z.object({
  workspaces: z.array(workspaceDto),
  activeWorkspaceId: z.string().min(1),
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