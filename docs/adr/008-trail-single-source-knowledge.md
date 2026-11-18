# ADR-008: Trail as single source of truth for knowledge

**Date:** 2026-11-18  
**Status:** accepted

## Context

Early Trail experiments treated product knowledge as files in the repo (`docs/` or `.trail/docs/`) with optional alignment to GitHub. The desktop pivot targets an orchestrator where agents read context via Trail MCP. Bidirectional sync between Trail and a repo docs folder creates dual sources of truth, merge noise, and conflict UI that does not pay off for a solo MVP.

## Decision

1. **Tasks:** GitHub Issues (+ Projects v2 Status) remain the source of truth; Trail caches and orchestrates.
2. **Knowledge** (ADRs, decisions, internal docs, ideas): **Trail only** (desktop: SQLite + app UI). Not mirrored two-way with `docs/` in the product repo.
3. **Designs:** Stay versioned in git per desktop briefing (`design/`) — separate from generic knowledge docs; no change in this ADR.
4. **Later (optional):** one-way **export** from Trail to `docs/trail/` (read-only banner) or a one-time **import** from an existing `/docs` tree into Trail.
5. **Legacy** `@trail-pm/ui` / `.trail/docs/` markdown store is **deprecated** with the legacy track; do not extend. Remove per [docs-sync cleanup briefing](../superpowers/specs/2026-11-18-docs-sync-cleanup-briefing.md).

## Consequences

**Easier:** Clear agent story (MCP reads Trail); no doc sync conflicts; desktop Docs screen edits Trail store, not repo working tree.

**Harder:** Repo-only readers no longer see product docs unless exported; desktop briefing (2026-11-18) must be amended where it describes `docs/` read/write via git in MVP.

**Supersedes (for desktop):** Implied two-way `docs/` sync in `2026-11-18-trail-desktop-briefing.md` (Docs screen, Edit doc → commit/PR, onboarding “import docs folder” as ongoing sync).

## Related

- [ADR-003](003-github-issues-source-of-truth.md) — issues on GitHub (unchanged)
- [ADR-007](007-electron-desktop-pivot.md) — Electron primary product
- Inventory: [2026-11-18-docs-sync-inventory.md](../superpowers/specs/2026-11-18-docs-sync-inventory.md)