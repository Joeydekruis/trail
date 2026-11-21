# Trail Desktop — fase 7 (autopilot v1) — gestart

**Goal:** Autopilot picks Todo issues with pickup labels, creates worktrees, starts agent runs within a parallel limit.

**Status:**

- [x] Per-workspace settings in SQLite (`enabled`, `maxParallel`, pickup labels defaults)
- [x] `pickAutopilotIssue` (priority + issue number, skip active worktrees)
- [x] Background scheduler + tick after GitHub sync
- [x] Board autopilot toggle persisted
- [x] Settings → Agents: parallel run limit
- [x] Move issue to In progress on GitHub when autopilot picks
- [ ] Global pause autopilot / waiting-for-decision gate
- [ ] Draft PR on successful run