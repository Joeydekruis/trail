import type { WorkspaceDto } from "@trail/ipc";
import { getDocsFixture } from "./design/docs-fixture";
import { ViewPageHeader } from "./design/ViewPageHeader";
import { SyncStatus, TrailButton } from "./design/TrailUi";

export function DocsView({
  workspace,
  onSyncNow,
  syncing,
}: {
  workspace: WorkspaceDto | undefined;
  onSyncNow: () => void;
  syncing: boolean;
}) {
  const fixture = getDocsFixture(workspace);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ViewPageHeader
        title="Docs"
        subtitle={`${fixture.repo} · docs folder, synced with GitHub`}
        actions={
          <>
            <TrailButton variant="secondary" disabled={syncing} onClick={onSyncNow}>
              {syncing ? "Syncing…" : "Sync now"}
            </TrailButton>
            <TrailButton variant="primary">New doc</TrailButton>
          </>
        }
      />
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div
          style={{
            width: 260,
            flex: "0 0 260px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {fixture.tree.map((section) => (
            <div key={section.overline}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 28,
                  padding: "8px 8px 0",
                  color: "var(--ink-faint)",
                }}
              >
                <span className="tr-overline">{section.overline}</span>
              </div>
              {section.entries.map((entry) => (
                <div
                  key={entry.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 28,
                    padding: "0 8px 0 16px",
                    borderRadius: 6,
                    background: entry.active ? "var(--surface-hover)" : "transparent",
                    color: entry.active ? "var(--ink)" : "var(--ink-muted)",
                  }}
                >
                  <span className="tr-mono" style={{ fontSize: 12 }}>
                    {entry.name}
                  </span>
                  <span className="tr-dot" style={{ marginLeft: "auto", color: `var(--${entry.sync})` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span className="tr-mono" style={{ fontSize: 12 }}>
              {fixture.doc.path}
            </span>
            <SyncStatus state="synced" label="Synced" />
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <TrailButton variant="secondary">Open in GitHub</TrailButton>
              <TrailButton variant="primary">Edit</TrailButton>
            </span>
          </div>
          <div style={{ padding: "20px 24px", maxWidth: 720, display: "flex", flexDirection: "column", gap: 18 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: "28px",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {fixture.doc.title}
            </h1>
            {fixture.doc.sections.map((s) => (
              <div key={s.heading}>
                <h2 style={{ margin: "0 0 6px", fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>
                  {s.heading}
                </h2>
                <p style={{ margin: 0, color: "var(--ink-soft)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}