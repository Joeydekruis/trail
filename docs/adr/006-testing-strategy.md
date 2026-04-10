# ADR-006: Testing strategy

**Date:** 2026-04-10
**Status:** accepted

## Context

Trail needs automated tests to ensure reliability. Need to choose a framework and approach.

## Decision

- **Framework:** Vitest
- **Test location:** Co-located (`foo.ts` → `foo.test.ts`)
- **Approach:** Unit tests for schemas and core functions. Integration tests for sync engine with mocked GitHub API.
- **Coverage:** Critical paths required. No numeric target.

## Consequences

- Vitest is fast, TypeScript-native, and has built-in mocking.
- Co-located tests are easy to find and maintain.
- Mocking the GitHub API avoids network calls in tests but requires maintaining mock fixtures.
- No E2E tests in v1 — added when the CLI is stable.
