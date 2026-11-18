# Trail Desktop — fase 0 implementatieplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gesigneerde installbare build op macOS en Windows, app-chrome met design tokens, onboarding-placeholder, en **prestatie-/groottefundament** dat vanaf dag één in CI wordt afgedwongen.

**Architecture:** electron-vite bundelt main, preload en renderer naar `out/`; electron-builder pakt alleen gebundelde output plus native modules. Geen feature-work buiten shell + onboarding-skeleton.

**Tech Stack:** Electron, electron-vite, electron-builder, electron-updater, TypeScript strict, `@trail/tokens`, `@trail/ipc`

**Specs:**

- [2026-11-18-trail-desktop-briefing.md](../specs/2026-11-18-trail-desktop-briefing.md) — fase 0 scope (signing, auto-update, shell)
- [2026-11-18-trail-desktop-performance-briefing.md](../specs/2026-11-18-trail-desktop-performance-briefing.md) — buildgrootte, start-UX, CI-budgets
- [2026-11-18-trail-desktop-design.md](../specs/2026-11-18-trail-desktop-design.md) — repo-kaart

## Global Constraints

- Installer: geen `node_modules` in artifact; alleen `en` en `nl`; asar + `compression: maximum`; native `.node` via `asarUnpack`.
- Builds: aparte artifacts macOS arm64, macOS x64, Windows x64 (geen universal).
- Renderer eerste scherm (gzip): **< 400 KB** (size-limit, faalt in CI na nulmeting).
- Geen production sourcemaps in shipped build (upload apart voor crashes indien nodig).
- Venster: `backgroundColor: '#0b0d10'`, `show: false`, tonen op `ready-to-show`.
- Electron Fuses: `OnlyLoadAppFromAsar` aan; `RunAsNode`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments` uit.
- Elke nieuwe runtime dependency in PR: vermelding bundle-impact (bundlephobia of visualizer).

---

### Task 1: electron-builder en release-pijplijn

**Files:**

- Create: `apps/desktop/electron-builder.yml` (of `package.json` `build`-sectie)
- Create: `.github/workflows/desktop-release.yml` (of uitbreiden bestaande workflow)
- Modify: `apps/desktop/package.json` — `dist`/`publish` scripts

- [x] Configureer `files` zodat alleen `out/**` en native modules (`better-sqlite3` etc.) meegaan.
- [x] Zet `asar: true`, `compression: maximum`, `electronLanguages: ['en','nl']`, per-arch matrix in CI.
- [x] Blockmaps voor electron-updater (differential updates).
- [x] Documenteer signing/notarisatie-pad (macOS + Windows) volgens bouwbriefing; smoke test op schone VM.

### Task 2: CI-groottebudgetten (nulmeting)

**Files:**

- Create: `apps/desktop/size-limit.config.js` (of root)
- Modify: CI workflow — stap na `electron-vite build`

- [x] rollup-plugin-visualizer in productiebuild (artefact upload, niet in installer).
- [x] size-limit op eerste-scherm renderer bundle; sla nulmeting op als baseline (installergrootte + gzip bundle).
- [x] CI faalt bij overschrijding: +15 MB boven fase-0 installernulmeting of +5% per release (zie performance briefing).

### Task 3: App-chrome en onboarding-placeholder

**Files:**

- Modify: `apps/desktop/src/main/index.ts`
- Modify: `apps/desktop/src/renderer/src/App.tsx`
- Import: `packages/tokens/tokens.css`

- [x] Layout uit `design/desktop-dashboard/v1.html`: titelbalk, statusbalk, navigatie-skeleton.
- [x] Onboarding-route placeholder (640 px, 3 stappen visueel).
- [x] Bevestig `ready-to-show` en theme background (geen wit flash).

### Task 4: Electron Fuses en prod-build hygiene

**Files:**

- Modify: electron-builder / @electron/fuses configuratie
- Modify: `electron.vite.config.ts` — sourcemaps alleen in dev

- [x] Fuses volgens performance briefing.
- [x] Geen React DevTools / Storybook in production bundle.

### Task 5: Verificatie

- [x] `npm test && npm run typecheck` op repo-root.
- [x] Lokale `electron-vite build` + size-limit groen.
- [x] Handmatig: venster opent op theme-kleur, geen wit scherm (lokaal: `release-smoke/win-unpacked`).
- [ ] (Na signing) DMG/NSIS installeren op Mac + Windows smoke test.

**Fase-gate:** Gesigneerde build installeert op beide platformen; CI size-checks actief; documentatie verwijst naar performance acceptatiecriteria voor latere fases (cache-first start, Playwright timings in fase 5).