import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "@trail/ipc";

/** Narrow bridge for the preview WebContents only (pin submit). */
contextBridge.exposeInMainWorld("trailPreview", {
  submitPin: (payload: {
    comment: string;
    anchor: {
      selector: string;
      xpath: string;
      elementText: string;
      offsetX: number;
      offsetY: number;
      viewportWidth: number;
      viewportHeight: number;
      pageUrl: string;
    };
  }) =>
    ipcRenderer.invoke(IpcChannels.previewPinSubmit, payload) as Promise<
      { ok: true; pinNumber: number } | { ok: false; message: string }
    >,
});