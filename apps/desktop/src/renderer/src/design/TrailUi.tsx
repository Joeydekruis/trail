import type { CSSProperties, ReactNode } from "react";
import type { BoardCard } from "./board-fixture";

type Tone = "mint" | "amber" | "blue" | "violet" | "red" | "gray" | "claude";

const toneClass: Record<Tone, string> = {
  mint: "tr-tone-mint",
  amber: "tr-tone-amber",
  blue: "tr-tone-blue",
  violet: "tr-tone-violet",
  red: "tr-tone-red",
  gray: "tr-tone-gray",
  claude: "tr-tone-claude",
};

const chipClass: Record<Tone, string> = {
  mint: "tr-chip tr-chip-mint",
  amber: "tr-chip tr-chip-amber",
  blue: "tr-chip tr-chip-blue",
  violet: "tr-chip tr-chip-violet",
  red: "tr-chip tr-chip-red",
  gray: "tr-chip",
  claude: "tr-chip",
};

export function TrailButton({
  variant,
  children,
  disabled,
  onClick,
  type = "button",
}: {
  variant: "primary" | "secondary" | "ghost";
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls =
    variant === "primary"
      ? "tr-btn tr-btn-primary"
      : variant === "secondary"
        ? "tr-btn tr-btn-secondary"
        : "tr-btn tr-btn-ghost";
  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function TrailChip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={chipClass[tone]}>{children}</span>;
}

export function TrailStatTile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: Tone;
}) {
  return (
    <div className="tr-stat">
      <span className={tone ? `tr-stat-value ${toneClass[tone]}` : "tr-stat-value"}>{value}</span>
      <span className="tr-caption" style={{ fontSize: 12, color: "var(--ink-muted)" }}>
        {label}
      </span>
      <span className="tr-faint" style={{ fontSize: 11 }}>
        {note}
      </span>
    </div>
  );
}

export function TrailAvatar({
  initials,
  tone,
}: {
  initials: string;
  name: string;
  tone: Tone;
}) {
  const border =
    tone === "claude"
      ? "var(--claude)"
      : tone === "blue"
        ? "var(--blue)"
        : tone === "mint"
          ? "var(--mint)"
          : "var(--line-strong)";
  return (
    <span
      className="tr-avatar"
      style={{ borderColor: border, color: border }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function ConflictBanner({
  children,
  action,
  onAction,
}: {
  children: ReactNode;
  action: string;
  onAction?: () => void;
}) {
  return (
    <div className="tr-conflict">
      <span className="tr-conflict-text">{children}</span>
      <TrailButton variant="secondary" onClick={onAction} disabled={!onAction}>
        {action}
      </TrailButton>
    </div>
  );
}

export function TrailPanel({
  title,
  flush,
  children,
}: {
  title: string;
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="tr-panel">
      <div className="tr-panel-head">
        <h2>{title}</h2>
      </div>
      <div className={flush ? "tr-panel-body tr-flush" : "tr-panel-body"}>{children}</div>
    </div>
  );
}

export function SelectButton({ label }: { label: string }) {
  return (
    <button type="button" className="tr-select titlebar-no-drag">
      {label}
    </button>
  );
}

/** Dark-surface field styles for inputs and selects in onboarding/settings. */
export const trailFieldStyle: CSSProperties = {
  height: 34,
  padding: "0 10px",
  border: "1px solid var(--line-strong)",
  borderRadius: 8,
  background: "var(--surface-card)",
  color: "var(--ink)",
  WebkitTextFillColor: "var(--ink)",
  caretColor: "var(--ink)",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  width: "100%",
  boxSizing: "border-box",
};

export function TrailSelect({
  value,
  options,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      className="titlebar-no-drag"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={trailFieldStyle}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "tr-pill tr-pill-active" : "tr-pill"}
      aria-pressed={active ?? false}
      onClick={onClick}
    >
      {label}
      <span className="tr-mono">{count}</span>
    </button>
  );
}

export function IssueKanbanCard({ card, onClick }: { card: BoardCard; onClick?: () => void }) {
  return (
    <div
      className="tr-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        borderLeft: `3px solid ${card.prioColor}`,
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: card.prioColor,
        }}
      />
      <div className="tr-card-row">
        <span className="tr-mono tr-faint" style={{ fontSize: 11 }}>
          {card.issue}
        </span>
        <span className="tr-card-title" style={{ flex: 1, fontWeight: 500 }}>
          {card.title}
        </span>
        {card.agent ? (
          <TrailAvatar initials={card.agent.initials} name="" tone={card.agent.tone as Tone} />
        ) : null}
      </div>
      <div className="tr-card-row" style={{ flexWrap: "wrap", gap: 6 }}>
        {card.labels.map((l) => (
          <TrailChip key={l.text} tone={l.tone as Tone}>
            {l.text}
          </TrailChip>
        ))}
        {card.adr ? (
          <span className="tr-mono tr-faint" style={{ fontSize: 11 }}>
            {card.adr}
          </span>
        ) : null}
        {card.pr ? <TrailChip tone={(card.prTone ?? "violet") as Tone}>{card.pr}</TrailChip> : null}
      </div>
    </div>
  );
}

export function KanbanCard({
  issue,
  title,
  adr,
  pr,
  prTone,
  labels,
  agentInitials,
  onClick,
}: {
  issue: string;
  title: string;
  adr: string;
  pr: string;
  prTone: Tone;
  labels: { text: string; tone: Tone }[];
  agentInitials: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="tr-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        borderLeft: "3px solid var(--blue)",
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      <div className="tr-card-row">
        <span className="tr-mono tr-faint">{issue}</span>
        <span className="tr-card-title" style={{ flex: 1 }}>
          {title}
        </span>
        <span className="tr-avatar" style={{ width: 22, height: 22, fontSize: 10 }}>
          {agentInitials}
        </span>
      </div>
      <div className="tr-card-row">
        {labels.map((l) => (
          <span key={l.text} className={chipClass[l.tone]}>
            {l.text}
          </span>
        ))}
        <span className="tr-mono tr-faint">{adr}</span>
        <span className={chipClass[prTone]}>{pr}</span>
      </div>
    </div>
  );
}

export function DecisionRow({
  id,
  title,
  status,
  meta,
  conflict,
  selected,
}: {
  id: string;
  title: string;
  status: string;
  meta: string;
  conflict?: boolean;
  selected?: boolean;
}) {
  return (
    <div
      className="tr-dec"
      style={
        conflict
          ? { boxShadow: "inset 3px 0 0 var(--amber)" }
          : selected
            ? { background: "var(--surface-hover)" }
            : undefined
      }
    >
      <span className="tr-id">{id}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div className="tr-small">
          {status} · {meta}
          {conflict ? " · conflict" : ""}
        </div>
      </div>
    </div>
  );
}

export function ActivityItem({
  initials,
  tone,
  who,
  did,
  what,
  when,
  onOpenWhat,
}: {
  initials: string;
  tone: Tone;
  who: string;
  did: string;
  what: string;
  when: string;
  onOpenWhat?: () => void;
}) {
  return (
    <div className="tr-act">
      <TrailAvatar initials={initials} name={who} tone={tone} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tr-small">
          <strong style={{ color: "var(--ink)" }}>{who}</strong> {did}
        </div>
        {onOpenWhat ? (
          <button
            type="button"
            onClick={onOpenWhat}
            className="tr-mono tr-faint"
            style={{
              display: "block",
              fontSize: 11,
              padding: 0,
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {what}
          </button>
        ) : (
          <div className="tr-mono tr-faint" style={{ fontSize: 11 }}>
            {what}
          </div>
        )}
        <div className="tr-faint" style={{ fontSize: 11, marginTop: 2 }}>
          {when}
        </div>
      </div>
    </div>
  );
}

export function TrailProgressBar({
  title,
  pct,
  milestone,
}: {
  title: string;
  pct: number;
  milestone: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontWeight: 500, fontSize: 13 }}>{title}</span>
        <span className="tr-small">{milestone}</span>
      </div>
      <div
        style={{
          marginTop: 8,
          height: 6,
          borderRadius: 999,
          background: "var(--line)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--accent)",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

export function SyncStatus({ label }: { state: string; label: string }) {
  return (
    <span className="tr-sync">
      <span className="tr-dot" style={{ color: "var(--mint)" }} />
      {label}
    </span>
  );
}