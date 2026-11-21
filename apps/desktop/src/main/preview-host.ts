import { readFileSync } from "node:fs";
import {
  BrowserWindow,
  shell,
  WebContentsView,
  type Rectangle,
} from "electron";
import { DEFAULT_PREVIEW_URL, normalizePreviewUrl } from "@trail/core";
import type { PreviewWorktreeRef } from "@trail/ipc";
import { resolvePreviewOverlayScriptPath } from "./preview-overlay-path";
import { resolvePreviewPreloadPath } from "./preview-preload-path";

type PreviewKey = string;

type PreviewEntry = {
  view: WebContentsView;
  url: string;
  window: BrowserWindow | null;
  ref: PreviewWorktreeRef;
};

const entries = new Map<PreviewKey, PreviewEntry>();
const refByWebContentsId = new Map<number, PreviewWorktreeRef>();

function previewKey(ref: PreviewWorktreeRef): PreviewKey {
  return `${ref.workspaceId}:${ref.issueNumber}`;
}

function partitionForWorkspace(workspaceId: string): string {
  return `persist:preview-${workspaceId}`;
}

function registerWebContentsRef(view: WebContentsView, ref: PreviewWorktreeRef): void {
  refByWebContentsId.set(view.webContents.id, ref);
  view.webContents.on("destroyed", () => {
    refByWebContentsId.delete(view.webContents.id);
  });
}

function injectPinOverlay(view: WebContentsView): void {
  if (view.webContents.isDestroyed()) {
    return;
  }
  try {
    const script = readFileSync(resolvePreviewOverlayScriptPath(), "utf8");
    void view.webContents.executeJavaScript(script);
  } catch (error) {
    console.warn("[trail] preview pin overlay inject failed:", error);
  }
}

function createView(ref: PreviewWorktreeRef): WebContentsView {
  const view = new WebContentsView({
    webPreferences: {
      partition: partitionForWorkspace(ref.workspaceId),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: resolvePreviewPreloadPath(),
    },
  });
  view.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
  view.webContents.on("did-finish-load", () => {
    injectPinOverlay(view);
  });
  registerWebContentsRef(view, ref);
  return view;
}

export function getPreviewRefForWebContents(webContentsId: number): PreviewWorktreeRef | null {
  return refByWebContentsId.get(webContentsId) ?? null;
}

export function isPreviewWebContents(webContentsId: number): boolean {
  return refByWebContentsId.has(webContentsId);
}

export function setPreviewCommentMode(ref: PreviewWorktreeRef, enabled: boolean): void {
  const entry = entries.get(previewKey(ref));
  if (!entry || entry.view.webContents.isDestroyed()) {
    return;
  }
  void entry.view.webContents.executeJavaScript(
    `window.__trailPinOverlay?.setCommentMode(${enabled ? "true" : "false"})`,
  );
}

function detachFromWindow(entry: PreviewEntry): void {
  if (!entry.window) {
    return;
  }
  try {
    entry.window.contentView.removeChildView(entry.view);
  } catch {
    // view may already be removed
  }
  entry.window = null;
}

function disposeEntry(key: PreviewKey): void {
  const entry = entries.get(key);
  if (!entry) {
    return;
  }
  detachFromWindow(entry);
  if (!entry.view.webContents.isDestroyed()) {
    refByWebContentsId.delete(entry.view.webContents.id);
    entry.view.webContents.close();
  }
  entries.delete(key);
}

export function disposeAllPreviews(): void {
  for (const key of [...entries.keys()]) {
    disposeEntry(key);
  }
}

function resolveUrl(raw?: string): { ok: true; url: string } | { ok: false; message: string } {
  const normalized = normalizePreviewUrl(raw?.trim() || DEFAULT_PREVIEW_URL);
  if (!normalized.ok) {
    return normalized;
  }
  return normalized;
}

function hideOtherPreviews(win: BrowserWindow, activeKey: PreviewKey): void {
  for (const [key, entry] of entries) {
    if (key === activeKey || entry.window !== win) {
      continue;
    }
    detachFromWindow(entry);
  }
}

export function attachPreview(
  win: BrowserWindow,
  ref: PreviewWorktreeRef,
  rawUrl?: string,
): { ok: true; url: string } | { ok: false; message: string } {
  const urlResult = resolveUrl(rawUrl);
  if (!urlResult.ok) {
    return urlResult;
  }

  const key = previewKey(ref);
  let entry = entries.get(key);
  if (!entry) {
    entry = {
      view: createView(ref),
      url: "",
      window: null,
      ref,
    };
    entries.set(key, entry);
  }

  hideOtherPreviews(win, key);

  if (entry.url !== urlResult.url) {
    void entry.view.webContents.loadURL(urlResult.url);
    entry.url = urlResult.url;
  }

  if (entry.window !== win) {
    detachFromWindow(entry);
    win.contentView.addChildView(entry.view);
    entry.window = win;
  }

  return { ok: true, url: urlResult.url };
}

export function setPreviewBounds(
  win: BrowserWindow,
  ref: PreviewWorktreeRef,
  bounds: Rectangle,
): void {
  const entry = entries.get(previewKey(ref));
  if (!entry || entry.window !== win) {
    return;
  }
  if (bounds.width <= 0 || bounds.height <= 0) {
    detachFromWindow(entry);
    return;
  }
  if (!entry.window) {
    win.contentView.addChildView(entry.view);
    entry.window = win;
  }
  entry.view.setBounds(bounds);
}

export function detachPreview(ref: PreviewWorktreeRef): void {
  const key = previewKey(ref);
  const entry = entries.get(key);
  if (!entry) {
    return;
  }
  detachFromWindow(entry);
  setPreviewCommentMode(ref, false);
}

export function navigatePreview(
  ref: PreviewWorktreeRef,
  rawUrl: string,
): { ok: true; url: string } | { ok: false; message: string } {
  const urlResult = resolveUrl(rawUrl);
  if (!urlResult.ok) {
    return urlResult;
  }
  const entry = entries.get(previewKey(ref));
  if (!entry) {
    return { ok: false, message: "Preview is not attached" };
  }
  void entry.view.webContents.loadURL(urlResult.url);
  entry.url = urlResult.url;
  return { ok: true, url: urlResult.url };
}

export function onPreviewWindowClosed(win: BrowserWindow): void {
  for (const entry of entries.values()) {
    if (entry.window === win) {
      entry.window = null;
    }
  }
}