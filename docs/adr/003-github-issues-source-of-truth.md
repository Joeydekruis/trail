# ADR-003: GitHub Issues as remote source of truth

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail needs a remote source of truth for project tasks. Options: GitHub Issues, GitHub Projects, or a custom backend.

## Decision

GitHub Issues only. No GitHub Projects. No custom backend.

## Consequences

- One sync target — simpler sync engine, fewer API calls.
- GitHub Projects V2 API is brittle and poorly documented — avoided.
- Local task files store what GitHub Issues can't: dependencies, AI context, test strategy.
- The sync engine has a clear ownership model: GitHub owns some fields, local owns others.
- No real-time collaboration — sync is poll-based or on-demand.
