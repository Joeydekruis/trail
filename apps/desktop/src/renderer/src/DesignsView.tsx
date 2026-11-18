import { getDesignsFixture } from "./design/designs-fixture";
import { SelectButton, TrailButton, TrailChip } from "./design/TrailUi";

export function DesignsView() {
  const fixture = getDesignsFixture();

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
      <aside
        aria-label="Screens"
        style={{
          flex: "0 0 240px",
          display: "flex",
          flexDirection: "column",
          background: "var(--surface)",
          borderRight: "1px solid var(--line)",
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
          <span className="tr-overline">Screens</span>
          <span className="tr-count" style={{ marginLeft: 8 }}>
            8
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 8px 12px" }}>
          <div style={{ padding: "12px 8px 4px" }}>
            <span className="tr-overline">Desktop app</span>
          </div>
          {fixture.screens.map((s) => (
            <div
              key={s.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 32,
                padding: "0 8px",
                borderRadius: 6,
                background: s.active ? "var(--surface-hover)" : "transparent",
                color: s.active ? "var(--ink)" : "var(--ink-muted)",
              }}
            >
              <span style={{ fontSize: 13 }}>{s.name}</span>
              {s.dot ? <span className="tr-dot" style={{ color: "var(--violet)" }} /> : null}
              <span className="tr-mono tr-faint" style={{ marginLeft: "auto", fontSize: 11 }}>
                {s.version}
              </span>
            </div>
          ))}
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>
            {fixture.activeScreen}
          </h1>
          <TrailChip tone="mint">{fixture.statusChip}</TrailChip>
          <span className="tr-mono tr-faint" style={{ fontSize: 12 }}>
            {fixture.filePath}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="tr-seg" role="group">
              <button type="button" aria-pressed>
                Preview
              </button>
              <button type="button" aria-pressed={false}>
                Spec
              </button>
            </span>
            <SelectButton label="Compare with v2" />
            <TrailButton variant="secondary">Open in GitHub</TrailButton>
            <TrailButton variant="secondary">Full screen</TrailButton>
          </span>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            color: "var(--ink-muted)",
          }}
        >
          <p style={{ margin: 0, maxWidth: 420, textAlign: "center" }}>
            Design preview (HTML export) embeds here. Mock: v3 dashboard from{" "}
            <span className="tr-mono">design/desktop-dashboard/v1.html</span>.
          </p>
        </div>
        <div style={{ flex: "0 0 auto", padding: "6px 16px", borderTop: "1px solid var(--line)", background: "var(--surface)" }}>
          <span className="tr-small">
            Designed by Claude · saved to <span className="tr-mono">design/dashboard-v3</span> · merged into{" "}
            <span className="tr-mono">development</span> · 13:37
          </span>
        </div>
      </div>

      <aside
        aria-label="Versions"
        style={{
          flex: "0 0 320px",
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
          <span className="tr-overline">Versions</span>
          <span className="tr-count" style={{ marginLeft: 8 }}>
            4
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {fixture.versions.map((v) => (
            <div
              key={v.version}
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid var(--line-soft)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                background: v.active ? "var(--surface-hover)" : undefined,
                boxShadow: v.active ? "inset 2px 0 0 var(--accent)" : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="tr-mono" style={{ fontWeight: 600 }}>
                  {v.version}
                </span>
                <TrailChip tone={v.chipTone}>{v.chip}</TrailChip>
                <span className="tr-mono tr-faint" style={{ marginLeft: "auto", fontSize: 11 }}>
                  {v.hash}
                </span>
              </div>
              <span style={{ color: "var(--ink-soft)" }}>{v.summary}</span>
              <span className="tr-small">{v.meta}</span>
              {v.extra ? <span className="tr-small">{v.extra}</span> : null}
              {v.actions ? (
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <TrailButton variant="primary">Approve and merge</TrailButton>
                  <TrailButton variant="secondary">Preview</TrailButton>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div
          style={{
            flex: "0 0 auto",
            padding: "10px 14px",
            borderTop: "1px solid var(--line)",
            display: "flex",
            gap: 8,
          }}
        >
          <TrailButton variant="secondary">Restore v2</TrailButton>
          <TrailButton variant="secondary">Link to task</TrailButton>
        </div>
      </aside>
    </div>
  );
}