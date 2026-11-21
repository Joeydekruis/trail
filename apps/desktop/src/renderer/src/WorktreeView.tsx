import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PREVIEW_URL, normalizePreviewUrl } from "@trail/core/client";
import { getWorktreeFixture, type ChatLine } from "./design/worktree-fixture";
import { useBatchedAgentLines } from "./use-batched-agent-lines";
import { userChatLine } from "./worktree-user-chat-line";
import { previewPinToChatLine } from "./preview-pin-chat";
import { WorktreePreviewSurface } from "./worktree-preview-surface";
import { AgentChatLog } from "./agent-chat-log";
import { SelectButton, SyncStatus, TrailAvatar, TrailButton, TrailChip, TrailPanel, TrailProgressBar } from "./design/TrailUi";
import type { WorktreeSessionContext } from "./worktree-session";

type WorktreeViewProps = {
  context?: WorktreeSessionContext | null;
  workspaceId?: string;
  onOpenIssue?: (issue: string, title: string) => void;
  runError?: string | null;
  onStartAgentRun?: () => void;
  onStopAgentRun?: () => void;
  onSendAgentMessage?: (
    message: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  startRunBusy?: boolean;
  composerDraft?: { issueNumber: number; text: string } | null;
  onComposerDraftApplied?: () => void;
};

export function WorktreeView({
  context,
  workspaceId,
  onOpenIssue,
  runError,
  onStartAgentRun,
  onStopAgentRun,
  onSendAgentMessage,
  startRunBusy = false,
  composerDraft = null,
  onComposerDraftApplied,
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
      workspaceId={workspaceId}
      onOpenIssue={onOpenIssue}
      runError={runError}
      onStartAgentRun={onStartAgentRun}
      onStopAgentRun={onStopAgentRun}
      onSendAgentMessage={onSendAgentMessage}
      startRunBusy={startRunBusy}
      composerDraft={composerDraft}
      onComposerDraftApplied={onComposerDraftApplied}
    />
  );
}

function WorktreeViewBody({
  context,
  workspaceId,
  onOpenIssue,
  runError,
  onStartAgentRun,
  onStopAgentRun,
  onSendAgentMessage,
  startRunBusy,
  composerDraft,
  onComposerDraftApplied,
}: {
  context: WorktreeSessionContext;
  workspaceId?: string;
  onOpenIssue?: (issue: string, title: string) => void;
  runError?: string | null;
  onStartAgentRun?: () => void;
  onStopAgentRun?: () => void;
  onSendAgentMessage?: (
    message: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  startRunBusy?: boolean;
  composerDraft?: { issueNumber: number; text: string } | null;
  onComposerDraftApplied?: () => void;
}) {
  const fixture = getWorktreeFixture();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [mode, setMode] = useState<"chat" | "preview">("chat");
  const [commentMode, setCommentMode] = useState(false);
  const [extraMessages, setExtraMessages] = useState<ChatLine[]>([]);
  const [previewUrl, setPreviewUrl] = useState(DEFAULT_PREVIEW_URL);
  const [previewUrlDraft, setPreviewUrlDraft] = useState(DEFAULT_PREVIEW_URL);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewDevBusy, setPreviewDevBusy] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  useBatchedAgentLines(workspaceId, context.issueNumber, setExtraMessages);

  const sendAgentMessage = async (text: string) => {
    if (!onSendAgentMessage) {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setComposerError(null);
    setExtraMessages((prev) => [...prev, userChatLine(trimmed)]);
    const result = await onSendAgentMessage(trimmed);
    if (!result.ok) {
      setComposerError(result.message);
    }
    return result;
  };

  useEffect(() => {
    const api = window.trail;
    if (mode !== "preview" || !workspaceId || !api?.previewEnsureDevServer) {
      return;
    }
    let cancelled = false;
    setPreviewDevBusy(true);
    void api
      .previewEnsureDevServer({
        workspaceId,
        issueNumber: context.issueNumber,
      })
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setPreviewUrl(result.url);
          setPreviewUrlDraft(result.url);
          setPreviewError(null);
        } else {
          setPreviewError(result.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewDevBusy(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, workspaceId, context.issueNumber]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }
    const enabled = mode === "preview" && commentMode;
    void window.trail?.previewSetCommentMode?.({
      workspaceId,
      issueNumber: context.issueNumber,
      enabled,
    });
  }, [commentMode, context.issueNumber, mode, workspaceId]);

  useEffect(() => {
    const api = window.trail;
    if (!api?.onPreviewPin || !workspaceId) {
      return;
    }
    return api.onPreviewPin((payload) => {
      if (
        payload.workspaceId !== workspaceId ||
        payload.issueNumber !== context.issueNumber
      ) {
        return;
      }
      setExtraMessages((prev) => [...prev, previewPinToChatLine(payload)]);
      setCommentMode(false);
    });
  }, [workspaceId, context.issueNumber]);

  const seededMessages = useMemo<ChatLine[]>(() => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return [
      {
        who: "Trail",
        initials: "TR",
        tone: "mint",
        time,
        body: "Worktree is ready. Use Preview for the dev server (default port 3000) and Start run for agents.",
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
          {runError || composerError ? (
            <span className="tr-small" style={{ color: "var(--warning)" }}>
              {runError ?? composerError}
            </span>
          ) : null}
          {onStartAgentRun && context.status !== "running" ? (
            <TrailButton
              variant="primary"
              disabled={startRunBusy}
              onClick={onStartAgentRun}
            >
              {startRunBusy ? "Starting…" : "Start run"}
            </TrailButton>
          ) : null}
          {onStopAgentRun && context.status === "running" ? (
            <TrailButton variant="secondary" onClick={onStopAgentRun}>
              Stop run
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
          <ChatColumn
            messages={messages}
            composerDraft={
              composerDraft?.issueNumber === context.issueNumber ? composerDraft.text : null
            }
            onComposerDraftApplied={onComposerDraftApplied}
            isRunning={context.status === "running"}
            sendBusy={startRunBusy}
            onSend={(text) => sendAgentMessage(text)}
            onStop={onStopAgentRun}
          />
        ) : (
          <PreviewSplit
            workspaceId={workspaceId ?? ""}
            issueNumber={context.issueNumber}
            previewUrl={previewUrl}
            previewUrlDraft={previewUrlDraft}
            previewError={previewError}
            previewDevBusy={previewDevBusy}
            onPreviewUrlDraft={setPreviewUrlDraft}
            onCommitPreviewUrl={async () => {
              const normalized = normalizePreviewUrl(previewUrlDraft);
              if (!normalized.ok) {
                setPreviewError(normalized.message);
                return;
              }
              setPreviewError(null);
              setPreviewUrl(normalized.url);
              setPreviewUrlDraft(normalized.url);
              const nav = await window.trail?.previewNavigate?.({
                workspaceId: workspaceId ?? "",
                issueNumber: context.issueNumber,
                url: normalized.url,
              });
              if (nav && !nav.ok) {
                setPreviewError(nav.message);
              }
            }}
            messages={messages}
            commentMode={commentMode}
            onToggleComment={() => setCommentMode((v) => !v)}
            isRunning={context.status === "running"}
            sendBusy={startRunBusy}
            onSend={(text) => sendAgentMessage(text)}
            onStop={onStopAgentRun}
            composerDraft={
              composerDraft?.issueNumber === context.issueNumber ? composerDraft.text : null
            }
            onComposerDraftApplied={onComposerDraftApplied}
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

function ChatColumn({
  messages,
  composerDraft,
  onComposerDraftApplied,
  isRunning,
  sendBusy,
  onSend,
  onStop,
}: {
  messages: ChatLine[];
  composerDraft?: string | null;
  onComposerDraftApplied?: () => void;
  isRunning: boolean;
  sendBusy?: boolean;
  onSend: (text: string) => Promise<{ ok: true } | { ok: false; message: string } | undefined>;
  onStop?: () => void;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <AgentChatLog messages={messages} padding="8px 24px" maxWidth={800} />
      <WorktreeComposerBar
        draft={composerDraft}
        onDraftApplied={onComposerDraftApplied}
        isRunning={isRunning}
        sendBusy={sendBusy}
        onSend={onSend}
        onStop={onStop}
      />
    </div>
  );
}

function WorktreeComposerBar({
  compact = false,
  draft,
  onDraftApplied,
  isRunning,
  sendBusy = false,
  onSend,
  onStop,
}: {
  compact?: boolean;
  draft?: string | null;
  onDraftApplied?: () => void;
  isRunning?: boolean;
  sendBusy?: boolean;
  onSend?: (text: string) => Promise<{ ok: true } | { ok: false; message: string } | undefined>;
  onStop?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputId = compact ? "wtchat-compact" : "wtchat";
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lastDraftRef = useRef<string | null>(null);

  useEffect(() => {
    if (!draft || draft === lastDraftRef.current) {
      return;
    }
    lastDraftRef.current = draft;
    setMessage(draft);
    onDraftApplied?.();
    queueMicrotask(() => textareaRef.current?.focus());
  }, [draft, onDraftApplied]);

  const canSend = Boolean(onSend) && message.trim().length > 0 && !isRunning && !sendBusy && !submitting;

  const submit = async () => {
    if (!onSend || !canSend) {
      return;
    }
    setSubmitting(true);
    try {
      const result = await onSend(message);
      if (result?.ok) {
        setMessage("");
        lastDraftRef.current = null;
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <label htmlFor={inputId} className="tr-sr">
          Message the agent
        </label>
        <textarea
          ref={textareaRef}
          id={inputId}
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={
            isRunning
              ? "Wait for the run to finish, or stop it to send another prompt"
              : "Message Cursor in this worktree"
          }
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
            <TrailButton variant="secondary" disabled={!isRunning || !onStop} onClick={onStop}>
              Stop
            </TrailButton>
            <TrailButton
              variant="primary"
              disabled={!canSend}
              onClick={() => void submit()}
            >
              {submitting || sendBusy ? "Sending…" : "Send"}
            </TrailButton>
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewSplit({
  workspaceId,
  issueNumber,
  previewUrl,
  previewUrlDraft,
  previewError,
  previewDevBusy,
  onPreviewUrlDraft,
  onCommitPreviewUrl,
  messages,
  commentMode,
  onToggleComment,
  isRunning,
  sendBusy,
  onSend,
  onStop,
  composerDraft,
  onComposerDraftApplied,
}: {
  workspaceId: string;
  issueNumber: number;
  previewUrl: string;
  previewUrlDraft: string;
  previewError: string | null;
  previewDevBusy: boolean;
  onPreviewUrlDraft: (value: string) => void;
  onCommitPreviewUrl: () => void;
  messages: ChatLine[];
  commentMode: boolean;
  onToggleComment: () => void;
  isRunning: boolean;
  sendBusy?: boolean;
  onSend: (text: string) => Promise<{ ok: true } | { ok: false; message: string } | undefined>;
  onStop?: () => void;
  composerDraft?: string | null;
  onComposerDraftApplied?: () => void;
}) {
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
          <input
            className="tr-mono"
            aria-label="Preview URL"
            value={previewUrlDraft}
            onChange={(e) => onPreviewUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onCommitPreviewUrl();
              }
            }}
            onBlur={() => void onCommitPreviewUrl()}
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              padding: "0 10px",
              background: "var(--bg)",
              border: "1px solid var(--line-strong)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--ink-muted)",
            }}
          />
          <SyncStatus
            state={previewDevBusy ? "pending" : "synced"}
            label={previewDevBusy ? "Starting dev server…" : "Embedded preview"}
          />
          {previewError ? (
            <span className="tr-small" style={{ color: "var(--warning)" }}>
              {previewError}
            </span>
          ) : null}
          <button
            type="button"
            className={commentMode ? "tr-btn tr-btn-secondary is-on" : "tr-btn tr-btn-secondary"}
            aria-pressed={commentMode}
            data-tip="Click on the page to place a pin and send feedback to chat"
            data-tip-pos="below"
            onClick={onToggleComment}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Comment
          </button>
          <TrailButton
            variant="secondary"
            onClick={() => void window.trail?.openExternal?.(previewUrl)}
          >
            Open in browser
          </TrailButton>
        </div>
        <WorktreePreviewSurface
          workspaceId={workspaceId}
          issueNumber={issueNumber}
          url={previewUrl}
          active={Boolean(workspaceId)}
        />
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
        <AgentChatLog messages={messages} padding="4px 14px" />
        <WorktreeComposerBar
          compact
          draft={composerDraft}
          onDraftApplied={onComposerDraftApplied}
          isRunning={isRunning}
          sendBusy={sendBusy}
          onSend={onSend}
          onStop={onStop}
        />
      </div>
    </>
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