import { memo } from "react";
import type { ChatLine } from "./design/worktree-fixture";
import { TrailAvatar, TrailChip } from "./design/TrailUi";

export const ChatRow = memo(function ChatRow({ message: m }: { message: ChatLine }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "12px 0" }}>
      <TrailAvatar initials={m.initials} name={m.who} tone={m.tone === "blue" ? "blue" : "mint"} />
      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{m.who}</span>
          <span className="tr-small">{m.time}</span>
          {m.chip ? (
            <span style={{ marginLeft: "auto" }}>
              <TrailChip tone={m.chip.tone}>{m.chip.text}</TrailChip>
            </span>
          ) : null}
        </div>
        <span style={{ color: "var(--ink-soft)", whiteSpace: "pre-line" }}>{m.body}</span>
        {m.monoLines?.map((line) => (
          <span key={line} className="tr-mono tr-faint" style={{ fontSize: 12, lineHeight: "16px" }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  );
});