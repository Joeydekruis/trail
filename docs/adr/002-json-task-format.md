# ADR-002: JSON for task files

**Date:** 2026-04-10
**Status:** accepted

## Context

Local task files in `.trail/tasks/` need a format that is machine-readable, AI-friendly, and validates reliably.

Considered: YAML, JSON, JSONC.

## Decision

JSON. Validated with Zod schemas on every read and write.

## Consequences

- Zero ambiguity in parsing. No whitespace-sensitivity issues.
- Every LLM produces valid JSON more reliably than YAML.
- Zod validation is trivial — `schema.parse(JSON.parse(file))`.
- No YAML parser dependency needed.
- Harder to hand-edit than YAML, but users interact through CLI/UI, not raw files.
- GitHub API returns JSON — sync has zero format conversion.
