# ADR-005: Sync field ownership model

**Date:** 2026-04-10
**Status:** accepted

## Context

When syncing between GitHub Issues and local task files, both sides may change the same task. We need deterministic conflict resolution.

## Decision

Every field has exactly one owner (GitHub, Local, or Shared):

- **GitHub-owned** (title, description, labels, assignee, milestone): GitHub always wins.
- **Local-owned** (priority, dependencies, AI context, refs, branch, estimate): Local always wins.
- **Shared** (status, due_date): Last-write-wins by timestamp. Ambiguous conflicts (within 5s) are flagged for manual resolution.

## Consequences

- Most syncs are conflict-free because fields don't overlap.
- The "shared" category is small (2 fields), minimizing conflict surface.
- Users must resolve genuine conflicts manually — Trail never guesses.
- The ownership model is documented and predictable.
