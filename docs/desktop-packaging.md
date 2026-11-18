# Trail Desktop — packaging en signing

Zie ook [bouwbriefing — Packaging, signing en auto-update](superpowers/specs/2026-11-18-trail-desktop-briefing.md#packaging-signing-en-auto-update) en [fase 0 plan](superpowers/plans/2026-11-18-trail-desktop-phase-0.md).

## Lokaal

```bash
npm run build:desktop
npm run dist --workspace=@trail/desktop          # huidig platform/arch
npm run dist:dir --workspace=@trail/desktop      # uitgepakte map (snelle smoke test)
```

Op Windows zonder codesigning-certificaat: `set CSC_IDENTITY_AUTO_DISCOVERY=false`. Als `dist:dir` faalt op een gelockte `app.asar`, sluit een draaiende Trail-app en verwijder `apps/desktop/release/`, of bouw naar een andere map: `npm run dist:dir --workspace=@trail/desktop -- --config.directories.output=release-smoke`.

`electron-vite` verwacht `electron` in de repo-root (`package.json` `devDependencies`); de versie moet gelijk zijn aan `@trail/desktop`.

Configuratie staat in `apps/desktop/electron-builder.yml`. De installer bevat alleen `out/**` (geen volledige `node_modules`), `asar: true`, `compression: maximum`, en Chromium-talen `en` + `nl`. Blockmaps voor differentiële updates worden gegenereerd bij publicatie naar GitHub Releases (`publish.provider: github`).

Native modules (bijv. `better-sqlite3`) komen via `asarUnpack` op `**/*.node` zodra ze in de app zitten.

## CI — `desktop-release`

Workflow: `.github/workflows/desktop-release.yml` op tags `desktop-v*`.

| Runner | Architectuur | Artifact |
| --- | --- | --- |
| `macos-latest` | arm64, x64 (apart) | DMG + ZIP |
| `windows-latest` | x64 | NSIS |

### macOS signing en notarisatie

Vereist Apple **Developer ID Application**-certificaat op de keychain van de runner.

| Geheim / variabele | Doel |
| --- | --- |
| `APPLE_ID` | Apple ID voor notarisatie |
| `APPLE_APP_SPECIFIC_PASSWORD` of `APPLE_API_KEY_*` | `notarytool` |
| `APPLE_TEAM_ID` | Team ID |
| `CSC_LINK` + `CSC_KEY_PASSWORD` | `.p12` voor codesign (indien niet via keychain) |

In `electron-builder.yml`: zet `mac.notarize: true` zodra certificaten op de runner staan; hardened runtime en entitlements staan in `apps/desktop/build/entitlements.mac.plist`.

**Smoke test:** DMG op een schone Mac installeren; app start zonder Gatekeeper-blokkade; `spctl --assess --type execute -v` op de `.app`.

### Windows signing

Aanbevolen: **Azure Artifact Signing** via `win.azureSignOptions` in electron-builder (zie [electron-builder Windows signing](https://www.electron.build/docs/features/code-signing/code-signing-win)).

| Geheim / variabele | Doel |
| --- | --- |
| Azure signing-credentials (tenant, client, certificaat) | `azureSignOptions` in CI of config |

Alternatief: klassiek OV-code signing-certificaat (`CSC_LINK` / `CSC_KEY_PASSWORD`).

**Smoke test:** NSIS op Windows 11 zonder admin; SmartScreen kan in de eerste weken nog waarschuwen tot reputatie opbouwt.

## Auto-update

Runtime: `electron-updater` (later in main-process). Builds publiceren naar het GitHub-releasekanaal van dit repo; ZIP (macOS) en NSIS (Windows) plus blockmaps voor delta-downloads.