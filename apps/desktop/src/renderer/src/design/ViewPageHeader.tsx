import type { ReactNode } from "react";

export function ViewPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 18,
            lineHeight: "24px",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>
        <span className="tr-small">{subtitle}</span>
      </div>
      {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
    </div>
  );
}