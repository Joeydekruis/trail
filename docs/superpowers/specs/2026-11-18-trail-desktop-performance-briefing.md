# Trail Desktop — briefing prestaties en buildgrootte

Nov 18, 2026 · @Joey de Kruis

**Aanvulling op:** [2026-11-18-trail-desktop-briefing.md](./2026-11-18-trail-desktop-briefing.md). Trail blijft Electron, dus Chromium gaat altijd mee en de app wordt nooit zo klein als een Tauri-app. Deze briefing regelt wat we daarbovenop meeleveren, hoe snel de app opstart en hoe zuinig hij draait, met harde doelen die CI controleert.

## Buildgrootte

We leveren alleen gebundelde code, de twee native modules en de talen die we gebruiken mee; alles daarboven moet een groottebudget in CI passeren.

| Maatregel | Hoe | Effect |
| --- | --- | --- |
| Main en preload bundelen | electron-vite/esbuild bundelt main, preload en renderer; electron-builder krijgt alleen `out/` plus de native modules via `files` | Geen `node_modules`-boom in de installer |
| asar en compressie | `asar: true`, `compression: maximum`; native `.node`-bestanden via `asarUnpack` | Kleinere installer en minder losse bestanden |
| Alleen gebruikte talen | `electronLanguages: ['en', 'nl']` | Ongeveer 50 Chromium-taalbestanden minder |
| Per architectuur bouwen | Aparte builds voor macOS arm64 en x64 en Windows x64, geen universal | Universal is bijna twee keer zo groot |
| Lichte libraries | CodeMirror 6 (niet Monaco), `Intl` of date-fns (niet moment), losse lodash-functies of geen | Kleinere renderer-bundle |
| Fonts | Inter en JetBrains Mono als woff2, beperkt tot Latin | Een paar honderd KB minder |
| Geen sourcemaps in de build | Sourcemaps alleen naar crash-rapportage uploaden | Kleinere bundle, code niet leesbaar mee |
| Devtools en testcode eruit | React DevTools, mocks en Storybook alleen in dev | Schone productiebuild |
| Kleine updates | electron-updater met blockmaps (differential download) | Updates downloaden alleen gewijzigde blokken |

**Regels voor dependencies**

- Elke nieuwe runtime-dependency krijgt in de PR de toegevoegde grootte (bundlephobia of de visualizer-output).
- Zware onderdelen (doc-editor, design-viewer, conflictschermen) laden pas als je ze opent.
- Native modules alleen waar het moet: better-sqlite3, en node-pty alleen als de optionele terminal er komt. Geen extra native modules zonder ADR.

## Opstarten

Het dashboard staat er binnen 1,5 seconde met gecachte data; alles wat GitHub, agents of netwerk nodig heeft, start pas daarna.

**Volgorde bij het starten**

1. Main maakt het venster met `show: false` en `backgroundColor: '#0b0d10'`, en toont het bij `ready-to-show`. Geen wit scherm.
2. De renderer laadt alleen de shell en het actieve scherm (Dashboard of het laatst geopende scherm).
3. Data komt eerst uit de SQLite-cache, zodat het scherm meteen gevuld is.
4. Pas daarna starten, met een korte vertraging en na elkaar: GitHub-sync, de agent-runner (utility process), de MCP-server en de update-check.
5. Verse data vervangt de cache zonder dat het scherm opnieuw opbouwt.

**Technieken**

- **Lui laden in main:** modules als Octokit, simple-git en de MCP-SDK pas `import()`-en als ze nodig zijn, niet bovenaan het bestand.
- **Bytecode:** compileer main en preload met de bytecode-plugin van electron-vite (V8-bytecode); dat bespaart parse-tijd bij elke start.
- **Code splitting per scherm:** Dashboard en Board in de eerste bundle; Decisions, Docs, Doc-editor, Designs, Settings, Onboarding en de conflictschermen als losse chunks.
- **Geen blokkerende I/O voor het eerste venster:** geen `fs.*Sync`, geen git-commando's, geen netwerk.
- **Workspace wisselen** gebruikt dezelfde regel: eerst de cache tonen, dan op de achtergrond verversen. Accentkleur wisselt direct via CSS-variabelen, zonder herrender van de hele boom.

## Tijdens gebruik

De main process blijft vrij voor vensters en IPC; zwaar werk draait elders, en de UI rendert alleen wat zichtbaar is en verandert.

**Processen en IPC**

- Runner, git-commando's en het parsen van stream-json draaien in utility processes, niet in main.
- Nooit `ipcRenderer.sendSync` of synchrone `fs`-calls in main.
- Agent-output loopt via een `MessagePort` per worktree rechtstreeks van de runner naar de renderer, niet als losse IPC-berichten via main.
- SQLite in WAL-modus; schrijfacties gebundeld in transacties, en zware queries in een utility process.

**Renderer**

- **Streaming bundelen:** binnenkomende events in een buffer verzamelen en maximaal één keer per frame (`requestAnimationFrame`) of per 100 ms naar de state schrijven.
- **Virtualiseren:** chatlog, Activity, de Done-kolom, lijstweergave en Docs-boom met TanStack Virtual zodra een lijst boven de 100 items kan komen.
- **Kleine state-updates:** Zustand met selectors en `memo` op kaarten en chatberichten, zodat één nieuw bericht niet het hele scherm opnieuw rendert.
- **Drag-and-drop:** alleen de doelkolom herrendert tijdens slepen; de schrijfactie naar GitHub gaat optimistisch en draait terug bij een fout.
- **Animaties:** alleen `transform` en `opacity`; geen layout-animaties op lange lijsten.

**Preview en designs**

- Hooguit één actieve `WebContentsView` per zichtbare worktree; bij het sluiten van de tab `webContents.close()` aanroepen.
- Dev-servers van worktrees die al 10 minuten niet zichtbaar zijn, worden gestopt en starten weer bij openen.
- Design-HTML laadt pas bij openen van het scherm en wordt opgeruimd bij wegnavigeren.

**Netwerk en achtergrond**

- Polling met ETags en `If-None-Match`; een 304-antwoord kost geen rate limit.
- Interval 60 s met focus, 5 minuten als het venster geen focus heeft, gepauzeerd bij systeemslaap (`powerMonitor`).
- Verborgen vensters gebruiken `backgroundThrottling`; de runner merkt daar niets van omdat hij in een utility process draait.

**Electron-instellingen**

- `spellcheck: false` behalve in tekstvelden waar je schrijft (chat, docs).
- Electron Fuses: `RunAsNode`, `EnableNodeOptionsEnvironmentVariable` en `EnableNodeCliInspectArguments` uit; `OnlyLoadAppFromAsar` aan.

## Doelen en meten

Elk doel heeft een meetmethode en een plek waar het gecontroleerd wordt; een doel dat niemand meet, bestaat niet.

| Meting | Doel | Hoe gemeten | Waar |
| --- | --- | --- | --- |
| Installergrootte per architectuur | Nulmeting in fase 0 (lege app); daarna maximaal +15 MB boven die nulmeting en +5% per release | Bestandsgrootte van DMG en NSIS-installer | CI, faalt bij overschrijding |
| Renderer-bundle, eerste scherm (gzip) | < 400 KB | rollup-plugin-visualizer en size-limit | CI, faalt bij overschrijding |
| Losse schermchunks (gzip) | < 150 KB per chunk | size-limit | CI |
| Koude start tot bruikbaar dashboard | < 1,5 s op een M1 Mac, < 2,5 s op een gemiddelde Windows-laptop | Tijdstempel van `app.on('ready')` tot eerste render met cache-data, gelogd | Playwright-test per release |
| Workspace wisselen | < 150 ms | `performance.mark` rond de wissel | Playwright-test |
| Geheugen bij stilstand (1 workspace, geen run) | < 300 MB over alle processen | `app.getAppMetrics()` | Debug-paneel en releasecheck |
| Geheugen tijdens 2 runs + 1 preview | < 900 MB | `app.getAppMetrics()` | Releasecheck |
| UI tijdens een run | Geen taken > 50 ms in de renderer | Chrome DevTools Performance, Long Tasks API in dev | Handmatig per fase |
| CPU bij stilstand | < 1% gemiddeld | Activity Monitor / Taakbeheer, 5 minuten | Releasecheck |

**Debug-paneel**

Een verborgen paneel (Help → Diagnostics) toont per proces CPU en geheugen uit `app.getAppMetrics()`, de starttijd van de laatste start, het aantal open views en de grootte van de SQLite-cache. Zo zie je direct welk proces groeit.

**Testmachines**

Meet op de langzaamste machine die je echt gebruikt, niet alleen op je snelste Mac. Minimaal: een Apple Silicon-Mac en een Windows-laptop van rond de vier jaar oud met 8 GB geheugen.

## Acceptatiecriteria

Deze criteria gelden **naast** die in de bouwbriefing; vanaf fase 0 staan de CI-checks aan, de rest wordt per fase afgevinkt.

- [ ] CI meet de installergrootte en renderer-bundle bij elke build en faalt boven het budget.
- [ ] De installer bevat geen `node_modules`-map buiten de native modules, alleen talen `en` en `nl`, en geen sourcemaps.
- [ ] De app opent zonder wit scherm, in de achtergrondkleur van het thema.
- [ ] Koude start tot bruikbaar dashboard blijft onder 1,5 s (M1) en 2,5 s (Windows-laptop).
- [ ] Met lege of trage netwerkverbinding toont het dashboard binnen dezelfde tijd de gecachte data.
- [ ] Workspace wisselen duurt minder dan 150 ms.
- [ ] Een run met snelle agent-output geeft geen taken boven 50 ms in de renderer.
- [ ] Een chatlog van 5.000 regels scrolt vloeiend.
- [ ] Geheugen bij stilstand blijft onder 300 MB; na het sluiten van een preview-tab daalt het geheugen weer.
- [ ] Zonder focus pollt de app elke 5 minuten in plaats van elke minuut; bij slaapstand niet.
- [ ] Een update downloadt alleen de gewijzigde blokken.
- [ ] Het debug-paneel toont CPU en geheugen per proces.

## Koppeling aan MVP-fasering

Zie [bouwbriefing — Fasering](./2026-11-18-trail-desktop-briefing.md#fasering-en-milestones). Onderstaande tabel zegt **wanneer** prestatie-eisen landen; details staan in de secties hierboven.

| MVP-fase | Prestatie / build (minimaal) |
| --- | --- |
| **0 — Platform & shell** | electron-builder: gebundelde `out/`, asar + max compressie, `asarUnpack` voor native modules, `en`/`nl` alleen, **per-arch** artifacts (geen universal). CI: installergrootte-nulmeting, size-limit op eerste renderer-bundle, geen prod sourcemaps. Venster: `show: false`, theme `backgroundColor`, `ready-to-show`. electron-updater blockmaps. Electron Fuses volgens deze briefing. |
| **1 — Workspace & cache** | SQLite cache-first bij start en workspace-wissel; uitgestelde start van sync, runner, MCP, updates. Lui `import()` in main voor Octokit/git/MCP. Route-based chunks: shell + dashboard/board eerst. |
| **2 — Board & sync** | Focus-afhankelijk poll-interval (60 s / 5 min / slaap uit). WAL + transacties voor cache-writes. Geen synchrone IPC/fs op main-pad. |
| **3 — Worktree & runner** | Utility process voor runner en zware git/stream-json. Agent-stream via `MessagePort` naar renderer. rAF/100 ms batching voor chat. |
| **4 — Preview, designs, docs** | `WebContentsView`-lifecycle; preview idle stop (10 min); lazy design/doc-editor chunks; virtualisatie waar lijsten > 100 items; memo/selectors op kaarten en chat. |
| **5 — MVP afronding** | Playwright: koude start en workspace-wissel budgets. Help → Diagnostics paneel. Releasecheck geheugen/CPU volgens tabel Doelen en meten. |