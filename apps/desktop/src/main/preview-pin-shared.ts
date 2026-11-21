import { BrowserWindow } from "electron";

export const PREVIEW_PIN_CHANNEL = "trail.previewPin" as const;

export function broadcastPreviewPin(payload: {
  workspaceId: string;
  issueNumber: number;
  pinNumber: number;
  comment: string;
  pageUrl: string;
  selector: string;
  elementText: string;
  offsetX: number;
  offsetY: number;
}): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(PREVIEW_PIN_CHANNEL, payload);
  }
}