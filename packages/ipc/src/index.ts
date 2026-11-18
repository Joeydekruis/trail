import { z } from "zod";

/** IPC channel ids — extend as main/preload/renderer contract grows. */
export const IpcChannels = {
  workspaceSwitch: "workspace.switch",
  syncNow: "sync.now",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

export const workspaceSwitchPayload = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceSwitchPayload = z.infer<typeof workspaceSwitchPayload>;

export const syncNowPayload = z.object({
  workspaceId: z.string().min(1).optional(),
});

export type SyncNowPayload = z.infer<typeof syncNowPayload>;