import { SelectButton, TrailButton } from "./TrailUi";

export function TrailComposer({ modKey, maxWidth = 1100 }: { modKey: string; maxWidth?: number }) {
  return (
    <div style={{ flex: "0 0 auto", padding: "12px 24px 14px", borderTop: "1px solid var(--line)" }}>
      <div
        className="composer"
        style={{
          width: "100%",
          maxWidth,
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "10px 12px",
          background: "var(--surface-raised)",
          border: "1px solid var(--line-strong)",
          borderRadius: 12,
        }}
      >
        <label htmlFor="composer" className="tr-sr">
          Ask Trail
        </label>
        <textarea
          id="composer"
          rows={2}
          readOnly
          placeholder="Ask Trail, or type # for issues, @ for files, / for commands"
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "none",
            border: 0,
            outline: 0,
            background: "transparent",
            color: "var(--ink)",
            font: "inherit",
            lineHeight: "20px",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <SelectButton label="Cursor CLI" />
          <SelectButton label="New worktree" />
          <SelectButton label="Draft PR only" />
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <kbd className="tr-kbd">{modKey} Enter</kbd>
            <TrailButton variant="secondary">Start run</TrailButton>
          </span>
        </div>
      </div>
    </div>
  );
}