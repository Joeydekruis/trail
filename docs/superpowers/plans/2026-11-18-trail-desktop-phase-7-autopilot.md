# Trail Desktop — fase 7 (autopilot v1) — gestart

**Goal:** Autopilot picks Todo issues with pickup labels, creates worktrees, starts agent runs within a parallel limit.

**Status:**

- [x] Per-workspace settings in SQLite (`enabled`, `maxParallel`, pickup labels defaults)
- [x] `pickAutopilotIssue` (priority + issue number, skip active worktrees)
- [x] Background scheduler + tick after GitHub sync
- [x] Board autopilot toggle persisted
- [x] Settings → Agents: parallel run limit
- [x] Move issue to In progress on GitHub when autopilot picks
- [x] Global pause autopilot / waiting-for-decision gate (worktree `waiting` blocks new picks)
- [x] Draft PR on successful run (push branch + GitHub draft PR + In review)
- [x] Block agent runs when no CLI; pause autopilot + shell banner (Settings → Agents)
- [x] Shell banner on failed agent run (exit code) with Retry + Open worktree
- [x] Failed run banner: red state, mono test output tail, duration, Ask Claude why → worktree composer