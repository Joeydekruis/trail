import type { ChatLine } from "./design/worktree-fixture";

export function formatWorktreeChatTime(now: Date): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function userChatLine(body: string, now = new Date()): ChatLine {
  return {
    who: "You",
    initials: "YO",
    tone: "mint",
    time: formatWorktreeChatTime(now),
    body,
  };
}