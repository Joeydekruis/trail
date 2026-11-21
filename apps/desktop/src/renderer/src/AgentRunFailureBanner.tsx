import { formatAgentRunDuration } from "@trail/core/client";
import { TrailButton } from "./design/TrailUi";

export type AgentRunFailureDetails = {
  issueNumber: number;
  exitCode: number;
  durationMs?: number;
  outputSummary: string | null;
  backend?: "cursor" | "claude" | null;
};

export function AgentRunFailureBanner({
  failure,
  onRetry,
  onOpenWorktree,
  onAskWhy,
}: {
  failure: AgentRunFailureDetails;
  onRetry: () => void;
  onOpenWorktree: () => void;
  onAskWhy: () => void;
}) {
  const durationLabel =
    failure.durationMs !== undefined
      ? formatAgentRunDuration(failure.durationMs)
      : null;
  const askLabel = failure.backend === "claude" ? "Ask Claude why" : "Ask agent why";

  return (
    <div className="tr-conflict tr-conflict-red">
      <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <p className="tr-conflict-text" style={{ margin: 0 }}>
          Agent run failed for #{failure.issueNumber}
          {durationLabel ? ` after ${durationLabel}` : ""} (exit code {failure.exitCode}).
        </p>
        {failure.outputSummary ? (
          <pre
            className="tr-mono tr-faint"
            style={{
              margin: 0,
              padding: "8px 10px",
              borderRadius: 8,
              background: "var(--surface)",
              border: "1px solid var(--line-soft)",
              maxHeight: 96,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              fontSize: 11,
              lineHeight: "16px",
            }}
          >
            {failure.outputSummary}
          </pre>
        ) : null}
      </div>
      <span style={{ display: "inline-flex", gap: 8, flex: "0 0 auto", flexWrap: "wrap" }}>
        <TrailButton variant="secondary" onClick={onAskWhy}>
          {askLabel}
        </TrailButton>
        <TrailButton variant="secondary" onClick={onOpenWorktree}>
          Open worktree
        </TrailButton>
        <TrailButton variant="secondary" onClick={onRetry}>
          Retry
        </TrailButton>
      </span>
    </div>
  );
}