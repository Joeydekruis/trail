import { useEffect, useMemo, useRef, useState } from "react";
import { flattenPalette } from "./command-palette-groups";
import type { PaletteGroup, PaletteItem } from "./design/palette-fixture";
import { IconSearch } from "./design/TrailIcons";

type CommandPaletteProps = {
  open: boolean;
  query: string;
  groups: PaletteGroup[];
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onPick: (item: PaletteItem) => void;
};

export function CommandPalette({
  open,
  query,
  groups,
  onQueryChange,
  onClose,
  onPick,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const flat = useMemo(() => flattenPalette(groups), [groups]);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (open) {
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  if (!open) return null;

  const pickAt = (index: number) => {
    const item = flat[index];
    if (item) onPick(item);
  };

  let rowIndex = 0;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(5, 6, 8, 0.62)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "12vh",
        boxSizing: "border-box",
      }}
    >
      <div
        role="dialog"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 640,
          maxWidth: "calc(100% - 48px)",
          background: "var(--surface-raised)",
          border: "1px solid var(--line-strong)",
          borderRadius: 14,
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.55)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 14px",
            height: 52,
            borderBottom: "1px solid var(--line)",
          }}
        >
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, Math.max(0, flat.length - 1)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pickAt(cursor);
              }
            }}
            placeholder="Search tasks, worktrees, decisions, docs and actions"
            style={{
              flex: 1,
              minWidth: 0,
              height: 40,
              border: 0,
              outline: 0,
              background: "transparent",
              color: "var(--ink)",
              font: "inherit",
              fontSize: 15,
            }}
          />
          <kbd className="tr-kbd">Esc</kbd>
        </div>
        <div style={{ maxHeight: 400, overflow: "auto", padding: "4px 8px 8px" }}>
          {groups.map((group) => (
            <div key={group.name}>
              <div style={{ padding: "12px 8px 4px" }}>
                <span className="tr-overline">{group.name}</span>
              </div>
              {group.items.map((item) => {
                const idx = rowIndex++;
                const selected = idx === cursor;
                return (
                  <button
                    key={`${group.name}-${item.title}`}
                    type="button"
                    onClick={() => onPick(item)}
                    onMouseEnter={() => setCursor(idx)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: 36,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: 0,
                      textAlign: "left",
                      font: "inherit",
                      cursor: "pointer",
                      background: selected ? "var(--surface-hover)" : "transparent",
                      color: selected ? "var(--ink)" : "var(--ink-soft)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="tr-mono tr-faint"
                      style={{
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.sub}
                    </span>
                    <span className="tr-mono tr-faint" style={{ marginLeft: "auto", fontSize: 11 }}>
                      {item.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {groups.length === 0 ? (
            <div style={{ padding: "24px 12px", textAlign: "center" }} className="tr-small">
              Nothing matches that search.
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "8px 14px",
            borderTop: "1px solid var(--line)",
            fontSize: 12,
            color: "var(--ink-muted)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <kbd className="tr-kbd">Up Down</kbd>
            Navigate
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <kbd className="tr-kbd">Enter</kbd>
            Open
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <kbd className="tr-kbd">Esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}