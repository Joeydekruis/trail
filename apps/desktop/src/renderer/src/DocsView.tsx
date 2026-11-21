import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldVirtualizeList } from "./list-virtual-threshold";
import { VirtualScrollList } from "./virtual-scroll-list";
import type { KnowledgeDocDto, KnowledgeDocSummaryDto, WorkspaceDto } from "@trail/ipc";
import { ViewPageHeader } from "./design/ViewPageHeader";
import { MarkdownPreview } from "./markdown-preview";
import { SyncStatus, TrailButton, TrailChip } from "./design/TrailUi";

export function DocsView({
  workspace,
  onSyncNow,
  syncing,
}: {
  workspace: WorkspaceDto | undefined;
  onSyncNow: () => void;
  syncing: boolean;
}) {
  const [docs, setDocs] = useState<KnowledgeDocSummaryDto[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<KnowledgeDocDto | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const api = window.trail;
    if (!api?.listKnowledgeDocs || !workspace?.id) {
      return;
    }
    const result = await api.listKnowledgeDocs(workspace.id);
    setDocs(result.docs);
    if (result.docs.length > 0 && !selectedSlug) {
      setSelectedSlug(result.docs[0].slug);
    }
  }, [selectedSlug, workspace?.id]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    const api = window.trail;
    if (!api?.getKnowledgeDoc || !workspace?.id || !selectedSlug) {
      setActiveDoc(null);
      return;
    }
    void api.getKnowledgeDoc({ workspaceId: workspace.id, slug: selectedSlug }).then((result) => {
      if (!result.ok) {
        setError(result.message);
        setActiveDoc(null);
        return;
      }
      setError(null);
      setActiveDoc(result.doc);
      if (!editing) {
        setDraftTitle(result.doc.title);
        setDraftBody(result.doc.bodyMarkdown);
        setDirty(false);
      }
    });
  }, [editing, selectedSlug, workspace?.id]);

  const displayTitle = editing ? draftTitle : activeDoc?.title ?? "Docs";
  const displayBody = editing ? draftBody : activeDoc?.bodyMarkdown ?? "";

  const statusChip = useMemo(() => {
    if (dirty) {
      return <TrailChip tone="amber">Unsaved changes</TrailChip>;
    }
    if (activeDoc) {
      return <TrailChip tone="mint">Saved in Trail</TrailChip>;
    }
    return null;
  }, [activeDoc, dirty]);

  const save = async () => {
    const api = window.trail;
    if (!api?.saveKnowledgeDoc || !workspace?.id) {
      return;
    }
    setSaveBusy(true);
    try {
      const result = await api.saveKnowledgeDoc({
        workspaceId: workspace.id,
        slug: activeDoc?.slug,
        title: draftTitle,
        bodyMarkdown: draftBody,
      });
      setActiveDoc(result.doc);
      setSelectedSlug(result.doc.slug);
      setDirty(false);
      setEditing(false);
      await loadList();
    } finally {
      setSaveBusy(false);
    }
  };

  const docListRef = useRef<HTMLDivElement>(null);
  const docListVirtual = shouldVirtualizeList(docs.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <ViewPageHeader
        title="Docs"
        subtitle={`${workspace?.name ?? "Workspace"} · knowledge in Trail (SQLite, MCP-readable)`}
        actions={
          <>
            <TrailButton variant="secondary" disabled={syncing} onClick={onSyncNow}>
              {syncing ? "Syncing…" : "Sync GitHub"}
            </TrailButton>
            <TrailButton
              variant="primary"
              onClick={() => {
                setEditing(true);
                setDraftTitle("New doc");
                setDraftBody("# New doc\n\n");
                setDirty(true);
                setSelectedSlug(null);
                setActiveDoc(null);
              }}
            >
              New doc
            </TrailButton>
          </>
        }
      />
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minHeight: 420 }}>
        <div
          ref={docListVirtual ? docListRef : undefined}
          style={{
            width: 260,
            flex: "0 0 260px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxHeight: 520,
            overflow: "auto",
            minHeight: 0,
          }}
        >
          <span className="tr-overline" style={{ padding: "4px 8px", flex: "0 0 auto" }}>
            Knowledge
          </span>
          {docListVirtual ? (
            <VirtualScrollList
              scrollRef={docListRef}
              items={docs}
              estimateSize={30}
              getItemKey={(doc) => doc.slug}
              renderItem={(doc) => (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSlug(doc.slug);
                    setEditing(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 8px",
                    cursor: "pointer",
                    background: doc.slug === selectedSlug ? "var(--surface-hover)" : "transparent",
                    color: doc.slug === selectedSlug ? "var(--ink)" : "var(--ink-muted)",
                    font: "inherit",
                  }}
                >
                  <span className="tr-mono" style={{ fontSize: 12 }}>
                    {doc.slug}.md
                  </span>
                </button>
              )}
            />
          ) : (
            docs.map((doc) => (
              <button
                key={doc.slug}
                type="button"
                onClick={() => {
                  setSelectedSlug(doc.slug);
                  setEditing(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "pointer",
                  background: doc.slug === selectedSlug ? "var(--surface-hover)" : "transparent",
                  color: doc.slug === selectedSlug ? "var(--ink)" : "var(--ink-muted)",
                  font: "inherit",
                }}
              >
                <span className="tr-mono" style={{ fontSize: 12 }}>
                  {doc.slug}.md
                </span>
              </button>
            ))
          )}
        </div>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            minHeight: 420,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              borderBottom: "1px solid var(--line)",
              flexWrap: "wrap",
            }}
          >
            <span className="tr-mono" style={{ fontSize: 12 }}>
              {activeDoc ? `${activeDoc.slug}.md` : "draft.md"}
            </span>
            {statusChip}
            <SyncStatus state="synced" label="Not in git (ADR-008)" />
            {error ? (
              <span className="tr-small" style={{ color: "var(--warning)" }}>
                {error}
              </span>
            ) : null}
            <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {editing ? (
                <>
                  <TrailButton
                    variant="ghost"
                    onClick={() => {
                      setEditing(false);
                      setDirty(false);
                      if (activeDoc) {
                        setDraftTitle(activeDoc.title);
                        setDraftBody(activeDoc.bodyMarkdown);
                      }
                    }}
                  >
                    Discard
                  </TrailButton>
                  <TrailButton variant="primary" disabled={saveBusy || !dirty} onClick={() => void save()}>
                    {saveBusy ? "Saving…" : "Save"}
                  </TrailButton>
                </>
              ) : (
                <TrailButton variant="primary" disabled={!activeDoc} onClick={() => setEditing(true)}>
                  Edit
                </TrailButton>
              )}
            </span>
          </div>
          {editing ? (
            <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
              <textarea
                aria-label="Markdown editor"
                value={draftBody}
                onChange={(e) => {
                  setDraftBody(e.target.value);
                  setDirty(true);
                }}
                spellCheck={false}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: 16,
                  border: 0,
                  borderRight: "1px solid var(--line)",
                  background: "var(--bg)",
                  color: "var(--ink)",
                  fontFamily: "var(--font-mono, ui-monospace, monospace)",
                  fontSize: 13,
                  lineHeight: "20px",
                  resize: "none",
                  outline: "none",
                }}
              />
              <div style={{ flex: 1, minWidth: 0, padding: "20px 24px", overflow: "auto" }}>
                <input
                  aria-label="Document title"
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value);
                    setDirty(true);
                  }}
                  style={{
                    width: "100%",
                    marginBottom: 16,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--line-strong)",
                    background: "var(--bg)",
                    color: "var(--ink)",
                    font: "inherit",
                    fontWeight: 600,
                  }}
                />
                <MarkdownPreview markdown={draftBody} />
              </div>
            </div>
          ) : (
            <div style={{ padding: "20px 24px", maxWidth: 720, overflow: "auto" }}>
              <MarkdownPreview markdown={displayBody} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}