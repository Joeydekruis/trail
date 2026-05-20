# ADR-005: Sync field ownership model

**Date:** 2026-04-10
**Status:** accepted

## Context

When syncing between GitHub Issues and local task files, both sides may change the same task. We need deterministic conflict resolution.

## Decision

Every field has exactly one owner (GitHub, Local, or Shared):

- **GitHub-owned** (title, description prose, labels, assignee, milestone): GitHub always wins.
- **GitHub-stored via body meta block** (`<!-- trail:v1 -->` JSON: type, priority, estimate, status, dependencies, AI context, refs, branch, dates): GitHub body wins on pull; Trail writes the block on push.
- **Local-only** (draft tasks before promotion): Never synced until linked.
- **Shared** (status, due_date): Last-write-wins by timestamp. Ambiguous conflicts (within 5s) are flagged for manual resolution.

## Consequences

- Most syncs are conflict-free because fields don't overlap.
- The "shared" category is small (2 fields), minimizing conflict surface.
- Users must resolve genuine conflicts manually — Trail never guesses.
- The ownership model is documented and predictable.
