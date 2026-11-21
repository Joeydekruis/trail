import type { PreviewPinSubmitPayload, PreviewWorktreeRef } from "@trail/ipc";
import { previewPinSubmitResult } from "@trail/ipc";
import { getPreviewPinStore } from "./database";
import { broadcastPreviewPin } from "./preview-pin-shared";

export function submitPreviewPin(
  ref: PreviewWorktreeRef,
  payload: PreviewPinSubmitPayload,
) {
  const stored = getPreviewPinStore().create({
    workspaceId: ref.workspaceId,
    issueNumber: ref.issueNumber,
    comment: payload.comment,
    anchor: {
      selector: payload.anchor.selector,
      xpath: payload.anchor.xpath,
      elementText: payload.anchor.elementText,
      offsetX: payload.anchor.offsetX,
      offsetY: payload.anchor.offsetY,
      viewportWidth: payload.anchor.viewportWidth,
      viewportHeight: payload.anchor.viewportHeight,
      pageUrl: payload.anchor.pageUrl,
    },
  });
  broadcastPreviewPin({
    workspaceId: ref.workspaceId,
    issueNumber: ref.issueNumber,
    pinNumber: stored.pinNumber,
    comment: stored.comment,
    pageUrl: stored.anchor.pageUrl,
    selector: stored.anchor.selector,
    elementText: stored.anchor.elementText,
    offsetX: stored.anchor.offsetX,
    offsetY: stored.anchor.offsetY,
  });
  return previewPinSubmitResult.parse({ ok: true, pinNumber: stored.pinNumber });
}