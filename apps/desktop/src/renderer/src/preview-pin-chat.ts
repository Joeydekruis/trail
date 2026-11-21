import type { PreviewPinEventDto } from "@trail/ipc";
import type { ChatLine } from "./design/worktree-fixture";

export function previewPinToAgentPrompt(payload: PreviewPinEventDto): string {
  const offsetPct = `(${(payload.offsetX * 100).toFixed(0)}%, ${(payload.offsetY * 100).toFixed(0)}%)`;
  return [
    `Preview feedback (pin ${payload.pinNumber}): ${payload.comment}`,
    "",
    `Page: ${payload.pageUrl}`,
    `Element: ${payload.elementText} ${offsetPct}`,
    `Selector: ${payload.selector}`,
  ].join("\n");
}

export function previewPinToChatLine(payload: PreviewPinEventDto): ChatLine {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const offsetPct = `x ${(payload.offsetX * 100).toFixed(0)}%, y ${(payload.offsetY * 100).toFixed(0)}%`;
  return {
    who: "You",
    initials: "JK",
    tone: "mint",
    time,
    chip: { text: "From preview comment", tone: "violet" },
    body: `Pin ${payload.pinNumber}: "${payload.comment}"`,
    monoLines: [
      `${payload.pageUrl} · ${offsetPct} · ${payload.elementText}`,
      payload.selector,
    ],
  };
}