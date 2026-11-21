import { useCallback, useEffect, useMemo, useState } from "react";
import type { DesignScreenDto, WorkspaceDto } from "@trail/ipc";
import { getDesignsFixture } from "./design/designs-fixture";
import { SelectButton, TrailButton, TrailChip } from "./design/TrailUi";

export function DesignsView({ workspace }: { workspace?: WorkspaceDto }) {
  const fixture = getDesignsFixture();
  const [catalog, setCatalog] = useState<DesignScreenDto[] | null>(null);
  const [designRoot, setDesignRoot] = useState<string | null>(null);
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [selectedVersionPath, setSelectedVersionPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const api = window.trail;
    if (!api?.listDesigns || !workspace?.id) {
      setCatalog(null);
      return;
    }
    void api.listDesigns(workspace.id).then((result) => {
      setCatalog(result.screens);
      setDesignRoot(result.designRoot);
      if (result.screens.length > 0) {
        const first = result.screens[0];
        setSelectedScreenId(first.id);
        const latest = first.versions[first.versions.length - 1];
        setSelectedVersionPath(latest?.relativePath ?? null);
      }
    });
  }, [workspace?.id]);

  const screens = useMemo(() => {
    if (catalog && catalog.length > 0) {
      return catalog;
    }
    return fixture.screens.map((s) => ({
      id: s.name.toLowerCase().replace(/\s+/g, "-"),
      name: s.name,
      versions: [{ version: s.version, relativePath: fixture.filePath }],
    }));
  }, [catalog, fixture]);

  const activeScreen =
    screens.find((s) => s.id === selectedScreenId) ?? screens.find((s) => s.versions.length > 0) ?? screens[0];

  const activeVersion =
    activeScreen?.versions.find((v) => v.relativePath === selectedVersionPath) ??
    activeScreen?.versions[activeScreen.versions.length - 1];

  const loadPreview = useCallback(
    async (relativePath: string) => {
      const api = window.trail;
      if (!api?.getDesignPreviewUrl || !workspace?.id) {
        setPreviewUrl(null);
        return;
      }
      const result = await api.getDesignPreviewUrl({
        workspaceId: workspace.id,
        relativePath,
      });
      if (!result.ok) {
        setPreviewError(result.message);
        setPreviewUrl(null);
        return;
      }
      setPreviewError(null);
      setPreviewUrl(result.url);
    },
    [workspace?.id],
  );

  useEffect(() => {
    if (!activeVersion?.relativePath || !workspace?.id) {
      setPreviewUrl(null);
      return;
    }
    void loadPreview(activeVersion.relativePath);
  }, [activeVersion?.relativePath, loadPreview, workspace?.id]);

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
            {screens.length}
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "0 8px 12px" }}>
          {screens.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedScreenId(s.id);
                const latest = s.versions[s.versions.length - 1];
                setSelectedVersionPath(latest?.relativePath ?? null);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 32,
                padding: "0 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: s.id === activeScreen?.id ? "var(--surface-hover)" : "transparent",
                color: s.id === activeScreen?.id ? "var(--ink)" : "var(--ink-muted)",
                font: "inherit",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13 }}>{s.name}</span>
              <span className="tr-mono tr-faint" style={{ marginLeft: "auto", fontSize: 11 }}>
                {s.versions[s.versions.length - 1]?.version}
              </span>
            </button>
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
            {activeScreen?.name ?? fixture.activeScreen}
          </h1>
          <TrailChip tone="mint">{catalog?.length ? "From repo" : fixture.statusChip}</TrailChip>
          <span className="tr-mono tr-faint" style={{ fontSize: 12 }}>
            {activeVersion?.relativePath ?? fixture.filePath}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {activeScreen ? (
              <select
                aria-label="Design version"
                value={activeVersion?.relativePath ?? ""}
                onChange={(e) => setSelectedVersionPath(e.target.value)}
                style={{
                  height: 28,
                  borderRadius: 8,
                  border: "1px solid var(--line-strong)",
                  background: "var(--bg)",
                  color: "var(--ink-muted)",
                  padding: "0 8px",
                }}
              >
                {activeScreen.versions.map((v) => (
                  <option key={v.relativePath} value={v.relativePath}>
                    {v.version}
                  </option>
                ))}
              </select>
            ) : (
              <SelectButton label="Compare with v2" />
            )}
            <TrailButton
              variant="secondary"
              onClick={() => previewUrl && void window.trail?.openExternal?.(previewUrl)}
              disabled={!previewUrl}
            >
              Open in browser
            </TrailButton>
          </span>
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            background: "var(--bg)",
          }}
        >
          {previewError ? (
            <p className="tr-small" style={{ padding: 16, color: "var(--warning)", margin: 0 }}>
              {previewError}
            </p>
          ) : null}
          {previewUrl ? (
            <iframe
              title="Design preview"
              src={previewUrl}
              sandbox="allow-same-origin allow-scripts"
              style={{ flex: 1, width: "100%", border: 0, background: "#0b0d10" }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 32,
                color: "var(--ink-muted)",
              }}
            >
              <p style={{ margin: 0, maxWidth: 420, textAlign: "center" }}>
                {designRoot
                  ? "Select a screen with v{n}.html under design/."
                  : "Set a local repo path in Settings to load design/ from disk."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}