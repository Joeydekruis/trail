import { ipcMain } from "electron";
import {
  IpcChannels,
  knowledgeDocGetPayload,
  knowledgeDocGetResult,
  knowledgeDocListPayload,
  knowledgeDocListResult,
  knowledgeDocSavePayload,
  knowledgeDocSaveResult,
} from "@trail/ipc";
import { getKnowledgeDocStore, getWorkspaceStore } from "./database";

function resolveWorkspaceId(explicit?: string): string {
  return explicit ?? getWorkspaceStore().getActiveId();
}

function toDto(doc: {
  slug: string;
  title: string;
  bodyMarkdown: string;
  updatedAt: string;
}) {
  return {
    slug: doc.slug,
    title: doc.title,
    bodyMarkdown: doc.bodyMarkdown,
    updatedAt: doc.updatedAt,
  };
}

export function registerKnowledgeIpc(): void {
  ipcMain.handle(IpcChannels.knowledgeDocList, (_event, raw: unknown) => {
    const payload = knowledgeDocListPayload.parse(raw ?? {});
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const store = getKnowledgeDocStore();
    const docs = store.list(workspaceId);
    return knowledgeDocListResult.parse({ docs });
  });

  ipcMain.handle(IpcChannels.knowledgeDocGet, (_event, raw: unknown) => {
    const payload = knowledgeDocGetPayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const doc = getKnowledgeDocStore().get(workspaceId, payload.slug);
    if (!doc) {
      return knowledgeDocGetResult.parse({ ok: false, message: "Doc not found" });
    }
    return knowledgeDocGetResult.parse({ ok: true, doc: toDto(doc) });
  });

  ipcMain.handle(IpcChannels.knowledgeDocSave, (_event, raw: unknown) => {
    const payload = knowledgeDocSavePayload.parse(raw);
    const workspaceId = resolveWorkspaceId(payload.workspaceId);
    const saved = getKnowledgeDocStore().save({
      workspaceId,
      slug: payload.slug,
      title: payload.title,
      bodyMarkdown: payload.bodyMarkdown,
    });
    return knowledgeDocSaveResult.parse({ doc: toDto(saved) });
  });
}