import { useEffect } from "react";
import type { IssueDetail } from "./design/issue-detail-fixture";
import { IconClose } from "./design/TrailIcons";
import { SyncStatus, TrailAvatar, TrailButton, TrailChip } from "./design/TrailUi";

type IssueDetailModalProps = {
  open: boolean;
  detail: IssueDetail | null;
  modKey: string;
  onClose: () => void;
  onOpenWorktree?: () => void;
};

export function IssueDetailModal({ open, detail, modKey, onClose, onOpenWorktree }: IssueDetailModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !detail) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 54,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        background: "rgba(5, 7, 10, 0.62)",
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        role="dialog"
        aria-label="Issue details"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1240,
          height: "min(820px, 100%)",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55)",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "16px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="tr-mono tr-faint">{detail.issue}</span>
              <TrailChip tone={detail.statusTone}>{detail.status}</TrailChip>
              {detail.labels.map((l) => (
                <TrailChip key={l.text} tone={l.tone}>
                  {l.text}
                </TrailChip>
              ))}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 600 }}>{detail.title}</h2>
          </div>
          <span style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <TrailButton
              variant="secondary"
              disabled={!detail.htmlUrl}
              onClick={() => {
                if (detail.htmlUrl) {
                  void window.trail?.openExternal?.(detail.htmlUrl);
                }
              }}
            >
              Open on GitHub
            </TrailButton>
            <TrailButton
              variant="primary"
              onClick={() => {
                onOpenWorktree?.();
                onClose();
              }}
            >
              {detail.cta}
            </TrailButton>
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              flex: "0 0 auto",
              width: 28,
              height: 28,
              border: 0,
              borderRadius: 6,
              background: "transparent",
              color: "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            <IconClose />
          </button>
        </header>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          }}
        >
          <div style={{ padding: "18px 20px", overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <MetaGrid detail={detail} />
            <section>
              <div className="tr-overline">Description</div>
              <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>{detail.desc}</p>
            </section>
            <section>
              <div className="tr-overline">Acceptance criteria</div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {detail.steps.map((st) => (
                  <div key={st.text} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        flex: "0 0 auto",
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        border: `1px solid ${st.done ? "var(--mint)" : "var(--line-strong)"}`,
                        background: st.done ? "var(--mint)" : "transparent",
                      }}
                    />
                    <span style={{ color: "var(--ink-soft)" }}>{st.text}</span>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <div className="tr-overline">
                Comments on GitHub{" "}
                <span className="tr-mono tr-faint" style={{ marginLeft: 4 }}>
                  {detail.nComments}
                </span>
              </div>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                {detail.comments.map((c) => (
                  <div key={`${c.who}-${c.when}`} style={{ display: "flex", gap: 10 }}>
                    <TrailAvatar initials={c.initials} name={c.who} tone={c.tone} />
                    <div
                      style={{
                        flex: 1,
                        padding: "8px 10px",
                        border: "1px solid var(--line)",
                        borderRadius: 10,
                        background: "var(--surface-card)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 500 }}>{c.who}</span>
                        <span className="tr-small">{c.when}</span>
                      </div>
                      <div style={{ marginTop: 4, color: "var(--ink-soft)" }}>{c.text}</div>
                    </div>
                  </div>
                ))}
                <span className="tr-small">Replies are written on GitHub. Use the chat to draft one.</span>
              </div>
            </section>
            <section>
              <div className="tr-overline">Activity</div>
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.activity.map((a) => (
                  <div key={a.when + a.text} style={{ display: "flex", gap: 10 }}>
                    <span className="tr-mono tr-faint" style={{ flex: "0 0 72px", fontSize: 11 }}>
                      {a.when}
                    </span>
                    <span style={{ color: "var(--ink-soft)" }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside
            aria-label="Chat about this issue"
            style={{
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--line)",
              background: "var(--bg)",
            }}
          >
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span className="tr-overline">Chat about this issue</span>
              <span className="tr-small" style={{ marginLeft: "auto" }}>
                {detail.issue}
              </span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <span className="tr-small">Trail</span>
              <IssueChatHint />
            </div>
            <div style={{ flex: "0 0 auto", padding: "10px 12px 12px", borderTop: "1px solid var(--line)" }}>
              <IssueChatComposer modKey={modKey} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaGrid({ detail }: { detail: IssueDetail }) {
  const cells: [string, string][] = [
    ["Status", detail.status],
    ["Priority", detail.prioLabel],
    ["Worked by", detail.by],
    ["Decision", detail.adr],
    ["Pull request", detail.pr],
    ["Sync", detail.syncLabel],
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "12px 16px",
        padding: "12px 14px",
        background: "var(--surface-raised)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        fontSize: 12,
        lineHeight: "16px",
      }}
    >
      {cells.map(([label, value]) => (
        <div key={label}>
          <div className="tr-overline">{label}</div>
          <div
            style={{
              marginTop: 4,
              color: label === "Priority" ? detail.prioColor : undefined,
            }}
          >
            {label === "Sync" ? <SyncStatus state="synced" label={value} /> : value}
          </div>
        </div>
      ))}
    </div>
  );
}

function IssueChatHint() {
  return (
    <div
      style={{
        padding: "8px 10px",
        border: "1px solid var(--line)",
        borderRadius: 10,
        background: "var(--surface-raised)",
        color: "var(--ink-soft)",
      }}
    >
      Ask me to change this issue, split it up, sharpen the acceptance criteria or link a decision. I draft the
      change and you review it on GitHub. Nothing is edited from here.
    </div>
  );
}

function IssueChatComposer({ modKey }: { modKey: string }) {
  return (
    <div
      className="composer"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "10px 12px",
        background: "var(--surface-raised)",
        border: "1px solid var(--line-strong)",
        borderRadius: 12,
      }}
    >
      <textarea
        rows={2}
        readOnly
        placeholder="Ask about this issue, or ask for a change. Type # for issues, / for commands"
        style={{
          width: "100%",
          border: 0,
          outline: 0,
          background: "transparent",
          color: "var(--ink)",
          font: "inherit",
          resize: "none",
        }}
      />
      <IssueChatBar modKey={modKey} />
    </div>
  );
}

function IssueChatBar({ modKey }: { modKey: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="tr-small">You</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", gap: 10 }}>
        <kbd className="tr-kbd">{modKey} Enter</kbd>
        <TrailButton variant="primary">Send</TrailButton>
      </span>
    </div>
  );
}