# ADR-007: Electron desktop as primary product

**Date:** 2026-11-18
**Status:** accepted

## Context

Trail started as a GitHub-native CLI with JSON tasks under `.trail/` and an optional local web UI (`@trail-pm/ui`). Product direction has shifted to **Trail Desktop**: a single Electron app that orchestrates GitHub Issues, git worktrees, local coding agents, preview with pin comments, and an embedded MCP server.

The desktop stack needs Chromium (`WebContentsView`) for consistent preview and pin overlay on macOS and Windows. GitHub (not local JSON) is the source of truth for tasks; Trail keeps a SQLite cache only.

## Decision

1. **Primary spec:** `docs/superpowers/specs/2026-11-18-trail-desktop-briefing.md` (and design reference `design/desktop-dashboard/v1.html`).
2. **Monorepo layout (target):**
   - `apps/desktop` — Electron (main, preload, renderer)
   - `packages/core` — domain logic and sync (new; migrate from CLI over time)
   - `packages/ipc` — typed IPC channels (Zod)
   - `packages/mcp` — desktop MCP server (stdio + local HTTP)
   - `packages/tokens` — design tokens → CSS variables
3. **Legacy (parallel until desktop MVP):** keep `packages/cli` (`@trail-pm/cli`) and `packages/ui` (`@trail-pm/ui`) buildable and tested; do not extend them for new desktop features.
4. **Supersedes in spirit:** ADR-002 (JSON task format) and ADR-004 (two-package monorepo) remain documented for the legacy track; new work follows the desktop briefing (GitHub Issues, `.trail/config.yml`, SQLite cache).

## Consequences

**Easier:** One installable app, real preview browser, autopilot and worktrees in one shell; aligns with design system and 14-screen canvas.

**Harder:** Larger codebase (Electron, signing, native modules); two product tracks briefly share the repo; eventual migration of GitHub client code from CLI to `packages/core`.

**Next:** Phase 0 in the briefing — electron-builder, signing smoke test, empty shell with design tokens and app chrome.