# Trail Desktop — fase 4 (preview, designs, docs) — gestart

**Goal:** Echte worktree-preview via `WebContentsView`, daarna designs/docs en performance-polish.

**Status:**

- [x] Preview — `WebContentsView` per worktree, IPC attach/setBounds/detach, localhost URL bar
- [x] Preview preload — pin overlay (shadow DOM) + Send to chat (SQLite anchors)
- [x] Preview idle — embedded view naar `about:blank` na 10 min zichtbaar (dev-server spawn volgt config)
- [x] Designs — lazy chunk + `design/` scan (`v{n}.html`) + iframe preview
- [x] Docs/Roadmap/Decisions — lazy-loaded chunks
- [x] Chat memo (`ChatRow`)
- [ ] Lijstvirtualisatie (>100 items)
- [ ] Docs editor (Markdown, SQLite kennis)

**Notities:** Comment-modus in de UI wacht op preview-preload; embedded view tekent boven renderer-HTML.