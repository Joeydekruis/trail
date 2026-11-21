import { useRef } from "react";
import type { ChatLine } from "./design/worktree-fixture";
import { ChatRow } from "./chat-row";
import { shouldVirtualizeList } from "./list-virtual-threshold";
import { VirtualScrollList } from "./virtual-scroll-list";

const CHAT_LINE_ESTIMATE_PX = 52;

type AgentChatLogProps = {
  messages: ChatLine[];
  padding: string;
  maxWidth?: number;
};

export function AgentChatLog({ messages, padding, maxWidth }: AgentChatLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtual = shouldVirtualizeList(messages.length);

  const lines =
    virtual ? (
      <VirtualScrollList
        scrollRef={scrollRef}
        items={messages}
        estimateSize={CHAT_LINE_ESTIMATE_PX}
        getItemKey={(m, i) => `${m.time}-${i}`}
        renderItem={(m) => <ChatRow message={m} />}
      />
    ) : (
      messages.map((m, i) => <ChatRow key={`${m.time}-${i}`} message={m} />)
    );

  return (
    <div
      ref={virtual ? scrollRef : undefined}
      style={{ flex: 1, minHeight: 0, overflow: "auto", padding }}
    >
      {maxWidth ? (
        <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>{lines}</div>
      ) : (
        lines
      )}
    </div>
  );
}