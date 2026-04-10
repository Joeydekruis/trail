# Contributing to Trail

## Getting started

1. Fork the repo
2. Clone your fork
3. `npm install` at the root
4. `npm test` to verify setup
5. Create a branch for your work

## Branch naming

| Type | Format | Example |
|---|---|---|
| Feature | `feat/<issue>-<slug>` | `feat/12-sync-engine` |
| Bug fix | `fix/<issue>-<slug>` | `fix/35-conflict-resolution` |
| Chore | `chore/<slug>` | `chore/update-deps` |
| Docs | `docs/<slug>` | `docs/readme-commands` |

## Commit messages

- Use imperative mood: "Add feature" not "Added feature"
- Keep subject under 72 characters
- Reference GitHub Issues when relevant: `feat(sync): add pull logic (#12)`

## Pull requests

- Reference the GitHub Issue in the PR description
- CI must pass (typecheck + tests)
- One logical change per PR

## Code standards

- TypeScript strict mode — no `any`
- Zod for all data validation
- Co-located test files (`*.test.ts` next to source)
- Run `npm test && npm run typecheck` before pushing

## Project layout

See `AGENTS.md` for the full project structure and patterns. For specifications and ADRs, see `docs/README.md`.

## Publishing `@trail-pm/cli` (maintainers)

1. **Bump the version** in **`packages/cli/package.json`** (and the **`packages/cli`** entry in **`package-lock.json`**) to a **new** semver — npm **rejects** republishing an existing version (`E403` / “cannot publish over the previously published versions”). Update **`CHANGELOG.md`** for the release.
2. Run `npm test && npm run typecheck && npm run build` at the repo root.
3. Commit and push to `main`, then tag: `git tag -a vX.Y.Z -m "vX.Y.Z"` and `git push origin vX.Y.Z`.
4. In GitHub: **Releases → Create a new release** from that tag and **publish** the release. The [release workflow](.github/workflows/release.yml) runs `npm publish` from **`packages/cli`** with **`NPM_TOKEN`** (classic token with publish rights to the `@trail-pm` scope, or a granular token for this package).

To publish manually instead: `cd packages/cli && npm publish --access public` (`prepublishOnly` runs the build). Log in with `npm login` or set `NPM_TOKEN` for CI-style auth.
