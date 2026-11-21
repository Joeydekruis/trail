import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ipcMain } from "electron";
import {
  IpcChannels,
  designListPayload,
  designListResult,
  designPreviewUrlPayload,
  designPreviewUrlResult,
} from "@trail/ipc";
import { getWorkspaceStore } from "./database";
import { listDesignScreens } from "./design-scan";
import { readWorkspaceRepoRoot } from "./worktree-paths";

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

export function registerDesignIpc(): void {
  ipcMain.handle(IpcChannels.designList, (_event, raw: unknown) => {
    const payload = designListPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const repoRoot = readWorkspaceRepoRoot(getWorkspaceStore(), workspaceId);
    const { designRoot, screens } = listDesignScreens(repoRoot);
    return designListResult.parse({ designRoot, screens });
  });

  ipcMain.handle(IpcChannels.designPreviewUrl, (_event, raw: unknown) => {
    const payload = designPreviewUrlPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const repoRoot = readWorkspaceRepoRoot(getWorkspaceStore(), workspaceId);
    if (!repoRoot) {
      return designPreviewUrlResult.parse({
        ok: false,
        message: "Set a local repository path in Settings",
      });
    }
    const normalized = payload.relativePath.replace(/\\/g, "/");
    if (normalized.includes("..") || normalized.startsWith("/")) {
      return designPreviewUrlResult.parse({ ok: false, message: "Invalid design path" });
    }
    const absolute = join(repoRoot, "design", normalized);
    return designPreviewUrlResult.parse({
      ok: true,
      url: pathToFileURL(absolute).toString(),
    });
  });
}