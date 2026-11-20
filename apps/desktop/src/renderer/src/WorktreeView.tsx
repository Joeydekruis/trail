import { useMemo, useState, type MouseEvent } from "react";
import { getWorktreeFixture, type ChatLine } from "./design/worktree-fixture";
import { SelectButton, SyncStatus, TrailAvatar, TrailButton, TrailChip, TrailPanel, TrailProgressBar } from "./design/TrailUi";
import type { WorktreeSessionContext } from "./worktree-session";

const PREVIEW_URL = "localhost:3000/sign-in";
const INITIAL_PINS = [{ n: 1, x: 72, y: 63 }];

type PreviewPin = { n: number; x: number; y: number };
type PreviewDraft = { n: number; x: number; y: number; el: string };

type WorktreeViewProps = {
  context?: WorktreeSessionContext | null;
  onOpenIssue?: (issue: string, title: string) => void;
  onStartAgentRun?: () => void;
  startRunBusy?: boolean;
};

export function WorktreeView({
  context,
  onOpenIssue,
  onStartAgentRun,
  startRunBusy = false,
}: WorktreeViewProps) {
  if (!context) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <p className="tr-small" style={{ maxWidth: 420, textAlign: "center", margin: 0 }}>
          Select a worktree in the sidebar, or choose <strong>Start in worktree</strong> on a board card.
        </p>
      </div>
    );
  }
  return (
    <WorktreeViewBody
      context={context}
      onOpenIssue={onOpenIssue}
      onStartAgentRun={onStartAgentRun}
      startRunBusy={startRunBusy}
    />
  );
}

function WorktreeViewBody({
  context,
  onOpenIssue,
  onStartAgentRun,
  startRunBusy,
}: {
  context: WorktreeSessionContext;
  onOpenIssue?: (issue: string, title: string) => void;
  onStartAgentRun?: () => void;
  startRunBusy?: boolean;
}) {
  const fixture = getWorktreeFixture();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [mode, setMode] = useState<"chat" | "preview">("chat");
  const [commentMode, setCommentMode] = useState(false);
  const [pins, setPins] = useState<PreviewPin[]>(INITIAL_PINS);
  const [draft, setDraft] = useState<PreviewDraft | null>(null);
  const [draftText, setDraftText] = useState("");
  const [extraMessages, setExtraMessages] = useState<ChatLine[]>([]);

  const seededMessages = useMemo<ChatLine[]>(() => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return [
      {
        who: "Trail",
        initials: "TR",
        tone: "mint",
        time,
        body: "This worktree is on disk. Agent chat and preview attach here in a later batch.",
        monoLines: [context.branch, context.path],
      },
    ];
  }, [context.branch, context.path]);

  const messages = useMemo(
    () => [...seededMessages, ...extraMessages],
    [seededMessages, extraMessages],
  );

  const setViewMode = (next: "chat" | "preview") => {
    setMode(next);
    if (next === "preview") {
      setDetailsOpen(false);
    }
  };

  const toggleDetails = () => {
    if (mode === "preview") {
      setMode("chat");
      setDetailsOpen(true);
      return;
    }
    setDetailsOpen((v) => !v);
  };

  const sendDraft = () => {
    const text = draftText.trim();
    if (!text || !draft) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const where = `${PREVIEW_URL} · x ${draft.x.toFixed(0)}%, y ${draft.y.toFixed(0)}% · ${draft.el}`;
    setPins((prev) => [...prev, { n: draft.n, x: draft.x, y: draft.y }]);
    setExtraMessages((prev) => [
      ...prev,
      {
        who: "You",
        initials: "JK",
        tone: "mint",
        time,
        chip: { text: "From preview comment", tone: "violet" },
        body: `Pin ${draft.n}: "${text}"`,
        monoLines: [where],
      },
    ]);
    setDraft(null);
    setDraftText("");
    setCommentMode(false);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          flex: "0 0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>
          <span className="tr-mono tr-faint">{context.issueRef}</span> {context.title}
        </h1>
        <TrailChip tone="mint">{context.statusLabel}</TrailChip>
        <span className="tr-mono tr-faint" style={{ fontSize: 12 }}>
          {context.branch}
        </span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <TrailButton
            variant="secondary"
            onClick={() => void window.trail?.openPath?.(context.path)}
          >
            Open folder
          </TrailButton>
          {onStartAgentRun && context.status !== "running" ? (
            <TrailButton
              variant="primary"
              disabled={startRunBusy}
              onClick={onStartAgentRun}
            >
              {startRunBusy ? "Starting…" : "Start run"}
            </TrailButton>
          ) : null}
          <ViewModeToggle mode={mode} onChange={setViewMode} />
          <TrailButton variant="secondary">Open in Cursor</TrailButton>
          <TrailButton variant="secondary">Open pull request</TrailButton>
          <button
            type="button"
            aria-label="Task details"
            aria-pressed={detailsOpen}
            onClick={toggleDetails}
            data-tip="Show or hide task details"
            data-tip-pos="below"
            style={{
              width: 32,
              height: 32,
              border: detailsOpen ? "1px solid var(--accent-line)" : "1px solid var(--line-strong)",
              borderRadius: 8,
              background: detailsOpen ? "var(--accent-soft)" : "var(--surface-raised)",
              color: "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        {mode === "chat" ? (
          <ChatColumn messages={messages} />
        ) : (
          <PreviewSplit
            messages={messages}
            commentMode={commentMode}
            onToggleComment={() => setCommentMode((v) => !v)}
            pins={pins}
            draft={draft}
            draftText={draftText}
            onDraftText={setDraftText}
            onCancelDraft={() => {
              setDraft(null);
              setDraftText("");
            }}
            onSendDraft={sendDraft}
            onCanvasClick={(x, y) => {
              if (!commentMode || draft) return;
              setDraft({ n: pins.length + 1, x, y, el: "Sign in button" });
            }}
          />
        )}
        {detailsOpen && mode === "chat" ? (
          <TaskDetailsAside fixture={fixture} onOpenIssue={onOpenIssue} />
        ) : null}
      </div>
    </div>
  );
}

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: "chat" | "preview";
  onChange: (m: "chat" | "preview") => void;
}) {
  return (
    <span
      role="group"
      aria-label="View"
      style={{
        position: "relative",
        display: "inline-flex",
        height: 32,
        padding: 2,
        border: "1px solid var(--line-strong)",
        borderRadius: 9,
        background: "var(--surface-raised)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: mode === "chat" ? 2 : 78,
          width: 76,
          height: 26,
          borderRadius: 7,
          background: "var(--accent-soft)",
          border: "1px solid var(--accent-line)",
          transition: "left 0.18s ease",
        }}
      />
      <button
        type="button"
        onClick={() => onChange("chat")}
        aria-pressed={mode === "chat"}
        style={{
          position: "relative",
          width: 76,
          height: 26,
          border: 0,
          background: "transparent",
          color: mode === "chat" ? "var(--ink)" : "var(--ink-muted)",
          font: "inherit",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Chat
      </button>
      <button
        type="button"
        onClick={() => onChange("preview")}
        aria-pressed={mode === "preview"}
        style={{
          position: "relative",
          width: 76,
          height: 26,
          border: 0,
          background: "transparent",
          color: mode === "preview" ? "var(--ink)" : "var(--ink-muted)",
          font: "inherit",
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Preview
      </button>
    </span>
  );
}

function ChatColumn({ messages }: { messages: ChatLine[] }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "8px 24px" }}>
        <div style={{ width: "100%", maxWidth: 800, margin: "0 auto" }}>
          {messages.map((m, i) => (
            <ChatRow key={`${m.time}-${i}`} message={m} />
          ))}
        </div>
      </div>
      <WorktreeComposerBar />
    </div>
  );
}

function WorktreeComposerBar({ compact = false }: { compact?: boolean }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        padding: compact ? "10px 12px 12px" : "12px 24px 14px",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        className="wt-composer composer"
        style={{
          width: "100%",
          maxWidth: compact ? "100%" : 800,
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
        <label htmlFor="wtchat" className="tr-sr">
          Message the agent
        </label>
        <textarea
          id="wtchat"
          rows={2}
          readOnly
          placeholder="Message Cursor in this worktree"
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SelectButton label="Cursor CLI" />
          <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
            <TrailButton variant="secondary">Stop</TrailButton>
            <TrailButton variant="primary">Send</TrailButton>
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatRow({ message: m }: { message: ChatLine }) {
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
}

function PreviewSplit({
  messages,
  commentMode,
  onToggleComment,
  pins,
  draft,
  draftText,
  onDraftText,
  onCancelDraft,
  onSendDraft,
  onCanvasClick,
}: {
  messages: ChatLine[];
  commentMode: boolean;
  onToggleComment: () => void;
  pins: PreviewPin[];
  draft: PreviewDraft | null;
  draftText: string;
  onDraftText: (t: string) => void;
  onCancelDraft: () => void;
  onSendDraft: () => void;
  onCanvasClick: (x: number, y: number) => void;
}) {
  const handleCanvas = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('[role="dialog"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick(x, y);
  };

  const draftPos =
    draft && draft.x > 55
      ? { right: `calc(${100 - draft.x}% + 16px)`, top: `${draft.y}%` }
      : draft
        ? { left: `calc(${draft.x}% + 16px)`, top: `${draft.y}%` }
        : undefined;

  return (
    <>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            borderBottom: "1px solid var(--line)",
            background: "var(--surface)",
          }}
        >
          <span className="tr-mono" style={{
            flex: 1,
            minWidth: 0,
            height: 28,
            display: "inline-flex",
            alignItems: "center",
            padding: "0 10px",
            background: "var(--bg)",
            border: "1px solid var(--line-strong)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--ink-muted)",
          }}>
            {PREVIEW_URL}
          </span>
          <SyncStatus state="synced" label="Dev server running" />
          <button
            type="button"
            className={commentMode ? "tr-btn tr-btn-secondary is-on" : "tr-btn tr-btn-secondary"}
            aria-pressed={commentMode}
            data-tip="Comment mode: click anywhere on the page to send feedback to the chat"
            data-tip-pos="below"
            onClick={onToggleComment}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Comment
          </button>
          <TrailButton variant="secondary">Open in browser</TrailButton>
        </div>
        <div
          data-preview-canvas=""
          onClick={handleCanvas}
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            background: "#e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            padding: 24,
            cursor: commentMode && !draft ? "crosshair" : "default",
          }}
        >
          <SignInMockCard />
          {pins.map((p) => (
            <span
              key={p.n}
              style={{
                position: "absolute",
                left: `calc(${p.x}% - 12px)`,
                top: `calc(${p.y}% - 12px)`,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--accent)",
                color: "var(--on-accent)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                boxShadow: "0 0 0 3px rgba(0,0,0,0.25)",
                pointerEvents: "none",
              }}
            >
              {p.n}
            </span>
          ))}
          {draft ? (
            <>
              <span
                style={{
                  position: "absolute",
                  left: `calc(${draft.x}% - 12px)`,
                  top: `calc(${draft.y}% - 12px)`,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "2px dashed var(--accent)",
                  background: "rgba(0,0,0,0.35)",
                  color: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                {draft.n}
              </span>
              <div
                role="dialog"
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  ...draftPos,
                  width: 320,
                  boxSizing: "border-box",
                  padding: 12,
                  background: "var(--surface-raised)",
                  border: "1px solid var(--accent)",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                  zIndex: 2,
                }}
              >
                <span style={{ fontWeight: 500, fontSize: 13 }}>New comment · pin {draft.n}</span>
                <textarea
                  id="pincomment"
                  rows={4}
                  autoFocus
                  value={draftText}
                  onChange={(e) => onDraftText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      onSendDraft();
                    }
                  }}
                  placeholder="What should change?"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 8,
                    background: "var(--bg)",
                    color: "var(--ink)",
                    font: "inherit",
                    fontSize: 13,
                    lineHeight: "20px",
                    resize: "none",
                    outline: 0,
                  }}
                />
                <span style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <TrailButton variant="ghost" onClick={onCancelDraft}>
                    Cancel
                  </TrailButton>
                  <TrailButton variant="primary" onClick={onSendDraft}>
                    Send to chat
                  </TrailButton>
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div
        style={{
          flex: "0 0 360px",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid var(--line)",
          background: "var(--surface)",
          minHeight: 0,
        }}
      >
        <div
          style={{
            flex: "0 0 36px",
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <span className="tr-overline">Chat</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "4px 14px" }}>
          {messages.map((m, i) => (
            <ChatRow key={`${m.time}-${i}`} message={m} />
          ))}
        </div>
        <WorktreeComposerBar compact />
      </div>
    </>
  );
}

function SignInMockCard() {
  return (
    <div
      data-preview-canvas=""
      style={{
        position: "relative",
        width: 340,
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        color: "#111827",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <span style={{ fontSize: 20, fontWeight: 600 }}>Sign in</span>
      <FakeField>Email</FakeField>
      <FakeField>Password</FakeField>
      <div
        style={{
          height: 38,
          borderRadius: 8,
          background: "#111827",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Sign in
      </div>
    </div>
  );
}

function FakeField({ children }: { children: string }) {
  return (
    <div
      style={{
        height: 36,
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        color: "#6b7280",
      }}
    >
      {children}
    </div>
  );
}

function TaskDetailsAside({
  fixture,
  onOpenIssue,
}: {
  fixture: ReturnType<typeof getWorktreeFixture>;
  onOpenIssue?: (issue: string, title: string) => void;
}) {
  return (
    <aside
      aria-label="Task details"
      style={{
        flex: "0 0 304px",
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderLeft: "1px solid var(--line)",
        minHeight: 0,
      }}
    >
      <div
        style={{
          flex: "0 0 36px",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span className="tr-overline">Task details</span>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <TrailPanel title="Task progress">
          <TrailProgressBar
            title={`${fixture.issue} ${fixture.title}`}
            pct={fixture.progressPct}
            milestone={fixture.progressNote}
          />
          <div style={{ paddingTop: 8, fontSize: 12, lineHeight: "18px" }}>
            {fixture.steps.map((st) => (
              <div key={st.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span
                  className="tr-dot"
                  style={{
                    color: st.done ? "var(--mint)" : st.active ? "var(--amber)" : "var(--ink-faint)",
                  }}
                />
                <span style={{ color: st.done || st.active ? "var(--ink-soft)" : "var(--ink-faint)" }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </TrailPanel>
        <TrailPanel title="Git">
          <GitBlock git={fixture.git} />
        </TrailPanel>
        <TrailPanel title="Connected design">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--ink-soft)" }}>Sign-in</span>
              <TrailChip tone="mint">v2 approved</TrailChip>
            </div>
            <span className="tr-mono tr-faint" style={{ fontSize: 11 }}>
              design/sign-in/v2.html
            </span>
          </div>
        </TrailPanel>
        <TrailPanel title="Documentation">
          <DocLink title="Worktrees" sub="docs/architecture/worktrees.md" />
          <DocLink title="Name the worktree after the task" sub="ADR-010" />
          <DocLink
            title="Fix redirect after sign-in"
            sub="Issue #42 on GitHub"
            onClick={() => onOpenIssue?.(fixture.issue, fixture.title)}
          />
        </TrailPanel>
      </div>
    </aside>
  );
}

function GitBlock({ git }: { git: ReturnType<typeof getWorktreeFixture>["git"] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, lineHeight: "18px" }}>
      <div>
        <span className="tr-faint">Branch </span>
        <span className="tr-mono">{git.branch}</span>
      </div>
      <div>
        <span className="tr-faint">Base </span>
        <span className="tr-mono">{git.base}</span>
      </div>
      <div>
        <span className="tr-faint">Folder </span>
        <span className="tr-mono">{git.folder}</span>
      </div>
      <div>
        <span className="tr-faint">Changes </span>
        <span className="tr-mono">{git.changes}</span>
      </div>
      <div>
        <span className="tr-faint">Pull request </span>
        {git.pr}
      </div>
    </div>
  );
}

function DocLink({ title, sub, onClick }: { title: string; sub: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "4px 0",
        border: 0,
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ color: "var(--ink-soft)" }}>{title}</span>
      <span className="tr-mono tr-faint" style={{ fontSize: 11 }}>
        {sub}
      </span>
    </button>
  );
}