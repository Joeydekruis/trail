# Trail Desktop — bouwbriefing (Electron, macOS + Windows)

Nov 18, 2026 · @Joey de Kruis

> **Amendement 2026-11-18 (ADR-008):** Geen tweerichtings-sync met een `docs/`-map in de repo. **Kennis** (interne docs, ADR's, beslissingen, ideeën) leeft in **Trail** (SQLite + UI); agents lezen via **MCP**. **Taken** blijven op **GitHub Issues**. **Designs** blijven git-gedreven in `design/`. Optioneel later: eenrichtings-export naar `docs/trail/` (alleen-lezen). Zie `docs/adr/008-trail-single-source-knowledge.md`.
>
> **Aanvulling 2026-11-18 (prestaties):** Buildgrootte, opstarttijd, runtime-zuinigheid en CI-budgets staan in [2026-11-18-trail-desktop-performance-briefing.md](./2026-11-18-trail-desktop-performance-briefing.md). Vanaf fase 0 gelden de CI-checks; acceptatiecriteria daar gelden naast de criteria onder Testen.

## Samenvatting

Bouw Trail Desktop als één Electron-app die je als installer downloadt voor macOS (Apple Silicon en Intel) en Windows (x64). Trail is de PM-laag en orchestrator boven GitHub: taken op Issues, kennis in Trail, designs in de repo, en lokale coding-agents (Cursor CLI of Claude Code) werken taken af in aparte git worktrees.

- **Gebruiker:** Joey als solo-founder, eerst alleen voor eigen gebruik op meerdere producten (Trail, Loupe, Dockyrd). Geen teamfuncties in de MVP.
- **Bron van waarheid:** de GitHub-repo. Trail bewaart geen eigen kopie van de data, alleen een lokale cache.
- **Kern:** één plek om te zien wat er loopt, taken in de juiste volgorde automatisch te laten oppakken (autopilot), en het resultaat in een ingebouwde browser te reviewen met pins die terug naar de chat gaan.
- **Waarom Electron en niet Tauri:** de preview met pin-commentaar heeft een echte Chromium-view nodig die op macOS en Windows hetzelfde werkt. Electron levert dat via `WebContentsView`; Tauri gebruikt de systeem-webview (WebKit of WebView2), waar meerdere ingesloten webviews nog experimenteel zijn.

De bron voor deze briefing is het design-canvas [TRAIL – Desktop dashboard (dark)](https://claude.ai/artifact/Jue25a7nHanhGBgUrSxtJk) (14 schermen, versie van 18 november 17:00, inclusief alle reviewcommentaren tot dan), het [Trail Design System](https://claude.ai/artifact/JsFXJa3hm4D9YfFJjtbb3B) en de eerdere gesprekken in dit project.

## Scope van de MVP

De MVP is een werkende desktop-app voor één gebruiker met zes schermen, GitHub-sync, een runner voor één of twee parallelle agents en de preview met pins.

| Onderdeel | In MVP | Toelichting |
| --- | --- | --- |
| Onboarding (3 stappen) | Ja | GitHub koppelen, repo kiezen, repo inrichten |
| Dashboard met chat-composer | Ja | Overzicht, worktrees, inspector |
| Board (kanban + lijst) | Ja | Kolommen uit het Projects Status-veld, prioriteit, slepen |
| Issue-modal met chat | Ja | Alleen lezen; wijzigen via de agent of op GitHub |
| New task (chat + formulier) | Ja | Chat is de primaire route |
| Worktree-scherm (chat, details, preview) | Ja | Het hart van de app |
| Decisions (ADR's) + conflict oplossen | Ja | In Trail (export naar git optioneel later) |
| Docs + doc-editor | Ja | Trail is bron; geen repo-`docs/` sync in MVP |
| Designs (HTML-versies) | Ja | Versies in `design/`, volledig scherm |
| Sync-conflict oplossen | Ja | Per veld GitHub of Trail kiezen |
| Fout- en lege staten | Ja | Offline, rate limit, run mislukt, tool ontbreekt, lege schermen |
| Settings per workspace | Ja | Zes secties, inclusief MCP |
| Autopilot | Ja | Todo-kolom, op prioriteit en dan van boven naar beneden |
| Lokale MCP-server | Ja | Lezen standaard aan; schrijven en runs starten per schakelaar |
| Roadmap / epics | Nee | Placeholder "Coming soon" in de navigatie |
| Apart Agents-scherm | Nee | Vervalt, het dashboard laat dit al zien |
| Web-app, Chrome-extensie, memory-laag | Nee | Later; de MCP-server is de koppeling |
| Multi-user, accounts, cloud-sync | Nee | Alles lokaal plus GitHub |
| Light mode | Nee | Alleen dark mode |
| Linux-build | Nee | Electron kan het later, geen MVP-doel |

## Technische stack en architectuur

Een TypeScript-monorepo met één Electron-app: de main process beheert vensters, git en agents; de renderer is een React-app; zware of langlopende taken draaien in utility processes.

&#91;embedded content: Procesarchitectuur · 4 processen, 5 externe koppelingen\]

De renderer en de preview praten alleen met main; alleen main en de runner raken GitHub, git en de CLI's.

| Laag | Keuze | Waarom |
| --- | --- | --- |
| Shell | Electron (actuele stabiele versie, niet ouder dan 2 majors) | Eén Chromium op macOS en Windows, `WebContentsView` voor de preview |
| Build | electron-vite + TypeScript strict | Snelle HMR voor main, preload en renderer |
| UI | React 19 + Vite | Sluit aan op de Storybook-stories (CSF 3) van het design system |
| Styling | CSS-variabelen uit `tokens.json` + CSS modules | Accentkleur wisselt per workspace via één variabele |
| State | Zustand (UI) + TanStack Query (data uit main) | Kleine stores, cache en invalidatie gratis |
| Routing | TanStack Router of React Router, hash-based | Werkt met `file://` en tabs |
| Lokale opslag | SQLite via better-sqlite3 in main | Cache van issues, runs, pins, chatlogs |
| Git | `git` CLI via `execa`, plus simple-git waar handig | Worktrees vereisen de echte git |
| GitHub | Octokit (REST + GraphQL voor Projects v2) | Issues, PR's, Projects Status-veld |
| Terminal/agents | child process met stream-json in een utility process (node-pty alleen voor een optionele terminal) | Cursor CLI en Claude Code draaien als PTY |
| MCP | `@modelcontextprotocol/sdk`, stdio + lokale HTTP | Agents lezen Trail-context |
| Packaging | electron-builder + electron-updater | DMG en NSIS, signing, auto-update |
| Tests | Vitest, Playwright (Electron-modus) | Unit en end-to-end |

**Processen**

- **Main:** vensterbeheer, menu's, IPC-router, GitHub-sync, git-worktrees, SQLite, keychain voor tokens, de MCP-server.
- **Renderer (app UI):** React, praat alleen via een getypte `contextBridge`-API (`window.trail.*`). Geen Node in de renderer.
- **Preview-view:** een aparte `WebContentsView` per worktree in een eigen `partition`, met een preload die de pin-overlay injecteert.
- **Agent-runner (utility process):** beheert de queue, start PTY's, streamt output naar main en logt naar SQLite. Crasht de runner, dan blijft de UI staan.

**IPC-contract:** één gedeeld pakket `@trail/ipc` met zod-schema's per kanaal (bijvoorbeeld `workspace.switch`, `board.move`, `run.start`, `pin.create`). Main valideert elk bericht en controleert `event.senderFrame`.

**Monorepo-indeling:** `apps/desktop` (main, preload, renderer), `packages/tokens`, toekomstig design-system package, `packages/core` (domein + GitHub-sync), `packages/ipc`, `packages/mcp`. Legacy: `packages/cli`, `packages/ui` (`@trail-pm/*`).

## Data en bron van waarheid

**Taken** en board-status komen van **GitHub**; Trail cachet en orkestreert. **Kennis** (docs, ADR's) leeft in **Trail** (SQLite). **Designs** en **`.trail/config.yml`** leven in de **repo** (git).

| Gegeven | Waar het leeft | Trail leest | Trail schrijft |
| --- | --- | --- | --- |
| Taken | GitHub Issues (ADR-011) | Ja | Titel, body, labels, assignee |
| Boardkolom | GitHub Projects v2, veld `Status` | Ja | Ja, bij slepen |
| Pull requests | GitHub | Ja | Draft-PR's door agents |
| Beslissingen | Trail (lokaal) | Ja | Ja, in Trail |
| Docs (kennis) | Trail (lokaal) | Ja | Ja, in Trail |
| Designs | `design/<scherm>/v<n>.html` | Ja | Ja, via branch `design/{screen}-v{n}` en PR |
| Workspace-config | `.trail/config.yml` | Ja | Ja |
| Runs, chatlogs, pins, cache | Lokale SQLite per gebruiker | Ja | Ja |
| GitHub-token | OS-keychain (`safeStorage`) | Ja | Ja |

**Sync-regels**

- De app pollt GitHub elke 60 seconden bij focus (instelbaar in Settings), elke 5 minuten zonder focus, gepauzeerd bij systeemslaap; geen webhooks. Gebruik ETags en `If-None-Match` zodat ongewijzigde data de rate limit niet raakt (zie [prestatiebriefing](./2026-11-18-trail-desktop-performance-briefing.md)).
- Docs en ADR's: geen sync met repo-`docs/` in MVP. Trail bewaart inhoud lokaal; agents gebruiken MCP. Alleen **issue/task**-conflicten met GitHub krijgen de Resolve-sync UI.
- Een conflict tussen GitHub en Trail (bijvoorbeeld issue #37 gesloten op GitHub maar In progress in Trail) toont de amber `ConflictBanner` met een Resolve-actie die het scherm "Resolve sync conflict" opent. Daar kies je per veld (state, boardkolom, labels, assignee) de waarde van GitHub of van Trail, of in één keer "Use GitHub for all".
- Elke kaart toont een sync-status: `synced`, `pending` (lokale wijziging nog niet gepusht) of `conflict`.

**`.trail/config.yml` (voorstel)**

```yaml
workspace: trail
repo: joeydekruis/trail
accent: "#4af7a3"
branches:
  integration: development
  production: main
folders:
  designs: design/          # git — HTML design versions
  # kennis (docs, ADR's): Trail SQLite — geen repo-map in MVP
board:
  statusField: Status
  columns: [Backlog, Todo, In progress, In review, Done]
agents:
  tool: cursor        # cursor | claude
  parallel: 2
  pickupLabels: [fix, agent-ready]
  draftPrOnly: true
  pauseOnDecision: true
  worktreeRoot: ~/trail-worktrees/trail
  removeAfterMerge: true
preview:
  devCommand: npm run dev
  url: http://localhost:3000
```

Persoonlijke instellingen (zoals notificaties en de worktree-locatie) horen niet in de repo; die staan in de lokale SQLite en overschrijven de repo-config.

## App-shell en navigatie

Het venster is een vaste shell van een titelbalk met vijf kolommen eronder; alleen het middengebied wisselt per scherm. Er is geen statusbalk onderaan.

1. **Titelbalk (36 px):** Trail-logo, applicatiemenu (File, Edit, View, Go, Agents, Help), zoekveld in het midden dat de command palette opent, vensterknoppen rechts.
   - macOS: native verkeerslichten links via `titleBarStyle: 'hiddenInset'`; het menu staat in de systeem-menubalk, niet in de titelbalk.
   - Windows: frameless met `titleBarOverlay` voor minimize, maximize en close; het menu staat in de titelbalk zoals in het design.
2. **Workspace-strip (56 px, uiterst links):** één letterknop per workspace (T, L, D), een knop om een workspace toe te voegen, en onderaan de profielknop (avatar JK). Het profiel staat hier en nergens anders.
3. **View-rail (48 px):** Dashboard, Board, Roadmap (Coming soon), Decisions, Docs, Designs, en Settings onderaan.
4. **Worktree-zijbalk (256 px):** alleen op Dashboard en Worktree. Secties "Worktrees" (lokaal, met de base-checkout `development` bovenaan) en "Remote worktrees" (uitgevoerd, met PR-status). Onderaan de autopilot-status ("Autopilot on · Cursor CLI · 1 of 2"). Op Board, Roadmap, Docs, Designs en Decisions is deze zijbalk weg.
5. **Middengebied:** tabbalk met open views (Dashboard, een worktree zoals "#42 Fix redirect", Board), met sluitknoppen en een plus-knop. De inhoud is gecentreerd met een max-breedte van 1100 px (Decisions en Docs 1200 px, chat 800 px).
6. **Statusinfo rechtsboven in de titelbalk (geen statusbalk):** huidige branch, sync-status ("Synced 2 min ago"), aantal lopende worktrees, gekozen coding-tool en "GitHub connected", compact naast de vensterknoppen. Het design toont nog een statusbalk van 24 px onderaan; die vervalt volgens het reviewcommentaar.

**Workspaces wisselen**

- Wisselen is globaal: alles wisselt mee (zijbalk, board, docs, statusbalk, tabs).
- Elke workspace heeft een eigen accentkleur die de hele app herkleurt via `--accent`, `--accent-soft`, `--accent-line`, `--on-accent` en de focus-ring. Voorbeelden uit het design: Trail mint `#4af7a3`, Loupe paars `#b26bff`, Dockyrd cyaan `#3dd6f5`.
- De actieve workspace krijgt een gekleurd streepje links in de strip en een rand in zijn accentkleur.
- Sneltoetsen: Ctrl/Cmd+1, +2, +3 enzovoort.
- Statuskleuren (mint voor running, amber, violet, blauw, rood) blijven vast; alleen het accent wisselt.

**Command palette (Ctrl/Cmd+K)**

Modaal venster met blur-achtergrond, 640 px breed. Zoekt in groepen: Pages, Worktrees, Tasks, Decisions, Docs, Actions (New task, New worktree, Sync now). Pijltjes navigeren, Enter opent, Esc sluit.

**Tooltips**

Eigen tooltip-component, geen native `title`-attributen. Donkere ballon (`#1b2027`) met rand en pijltje, 13 px tekst, verschijnt na ongeveer 80 ms. Posities: onder, onder-rechts, rechts. Elke icoonknop heeft een tooltip en een `aria-label`.

**Sneltoetsen**

Cmd op macOS, Ctrl op Windows. Minimaal: palette (K), nieuwe taak (N), workspace wisselen (1–9), versturen in composer (Enter met modifier), tab sluiten (W), chat/preview wisselen in een worktree.

## Schermen

Zes schermen plus Settings, elk gebouwd zoals in het design-canvas; waar een reviewcommentaar het design bijstuurde, geldt het commentaar.

### Dashboard

- Kop: "Dashboard" met `repo · development`, knoppen Sync now (secundair) en New task (primair, accentkleur).
- `ConflictBanner` bovenaan zodra er een sync-conflict is.
- Vier stat-tegels: Open tasks, Running now (met de limiet, bijvoorbeeld "Limit is 2 at once"), In review (draft-PR's), Decisions (met aantal proposed).
- Panel "Worktrees": per rij agent-avatar (Cursor of Claude), issuenummer en titel, laatste regel output in mono, status-chip (Running, Draft PR, Waiting for decision, Queued) en looptijd.
- Inspector rechts (304 px): Needs your review (kaarten), Decisions (laatste ADR's), Activity (Cursor, GitHub, jij).
- Composer onderaan, vast, gecentreerd op 1100 px: "Ask Trail, or type # for issues, @ for files, / for commands", met keuzes voor tool, New worktree en Draft PR only, en een Start run-knop. Bij focus krijgt de hele composer de accentrand, niet het tekstveld zelf.
- Geen roadmap-panel op het dashboard.

### Board

- Kop: "Board" met `repo · milestone · aantal open issues`, Sync now en New task (opent de New task-popup).
- Filterbalk: pills All, Agent-ready, Needs review (met aantallen), milestone-keuze, de autopilot-schakelaar (toont de tool, tooltip legt de volgorde uit) en rechts de toggle Board/List.
- Vijf kolommen van 272 px: Backlog, Todo, In progress, In review, Done. Elke kolom toont de GitHub-mapping (bijvoorbeeld "Projects: In progress", "open PR linked", "closed or merged").
- Het board is horizontaal gecentreerd en wordt alleen breder als er meer kolommen zijn; kop en filterbalk volgen dezelfde breedte.
- Kolommen lopen door tot de onderkant van het scherm en scrollen verticaal binnen de kolom; de kolomkop blijft sticky.
- Met autopilot aan krijgt de Todo-kolom een accentrand, het label "auto pickup" en de uitleg "Autopilot picks these up by priority, then top to bottom". Elke kaart toont zijn plek in de rij ("Picks up next", "Then #2").
- Kaarten slepen tussen kolommen (HTML5 drag-and-drop); de doelkolom licht op met een accentrand. Loslaten schrijft het Status-veld terug naar GitHub. Van Backlog naar Todo slepen zet de taak in de autopilot-queue.
- **Prioriteit:** opgeslagen als GitHub-label `priority:urgent`, `priority:high`, `priority:medium` of `priority:low`. Kleuren: urgent rood, high amber, medium blauw, low grijs. Binnen elke kolom (behalve Done) staan kaarten gesorteerd op prioriteit.
- **Kaart:** gekleurde prioriteitsbalk links (3 px), issuenummer, prioriteitslabel met drie staafjes rechtsboven, titel (max. 2 regels), labels als chips, en een voetregel met gekoppelde ADR, PR-chip, sync-status (alleen als die niet `synced` is) en agent-avatar.
- **Lijstweergave:** tabel gegroepeerd per status (groepskop met aantal), kolommen Issue, Title, Decision, Pull request, Sync, By.
- **Issue-modal** (klik op kaart of rij): groot venster tot 1240 × 820 px, verdeeld 60/40.
  - Kop: issuenummer, status- en label-chips, titel, en de acties Open on GitHub en Start in a worktree / Open worktree / Reopen issue.
  - Links (60%): blok met Status, Priority, Worked by, Decision, Pull request, Sync; daaronder Description, Acceptance criteria, Comments on GitHub en Activity.
  - Rechts (40%): "Chat about this issue" met dezelfde composer als op het dashboard: keuze voor wie (Claude, Cursor CLI, Claude Code) en modus (Ask, Draft change on GitHub, Split into sub-issues).
  - Je kunt het issue in de modal niet zelf bewerken. Wijzigingen lopen via de agent, die ze als voorstel op GitHub zet, of via Open on GitHub. Reacties schrijf je ook op GitHub.

### Worktree

Eén taak = één branch + één chat, in een eigen git worktree.

- Kop: issuenummer en titel, status-chip, `branch · tool · looptijd`, segment-toggle Chat/Preview, Open in Cursor (opent de worktree-map in Cursor), Open pull request, en een knop die het detailpaneel toont of verbergt.
- **Chat-modus:** de chat staat centraal (max 800 px) met de composer vast onderaan, net als op het dashboard. Berichten tonen herkomst-chips ("From task #42", "From preview comment") en tool-acties in mono ("› Edited src/auth/redirect.ts").
- **Detailpaneel rechts (304 px, inklapbaar):** Task progress (stappen met status), Git (branch, base, map, changes, PR), Connected design (met versie en link naar Designs), gekoppelde **Trail**-kennis (ADR/doc uit SQLite via MCP), GitHub-issue-link.
- **Preview-modus:** split-scherm. Het detailpaneel verdwijnt; de preview staat in het midden als browser; de chat schuift klein naar rechts (360 px). Zie Preview-browser en pin-commentaar.
- De worktree-zijbalk links blijft zichtbaar.

### Decisions

- Lijst van ADR's met id, titel, status (Proposed, Accepted, Superseded), auteur en datum. Knoppen Export to Markdown en New decision.
- Conflicten tussen beslissingen worden amber gemarkeerd.
- Een proposed ADR kan worktrees blokkeren ("Waiting for decision"); accepteren of afwijzen hier hervat die worktree.
- Opslag: **in Trail** (SQLite + Markdown-body); optionele export naar git pas later (ADR-008).

### Docs

- Boom van **pagina's in Trail** links; Markdown-weergave rechts. Knoppen **New doc** en zoeken; **geen** Sync now naar repo-`docs/`.
- Bewerken slaat direct op in Trail; agents lezen via `search_docs` / MCP-resources.

### Designs

- Links de schermen (gegroepeerd: Desktop app, Flows) met versienummer; rechts de versiegeschiedenis (Proposed, Approved, Superseded) met commit-hash, auteur, tijd en gekoppelde taken.
- In het midden het echte HTML-design, gerenderd in een gesandboxte view, niet een nagebouwde mockup. Knop voor volledig scherm die de zijpanelen verbergt.
- Acties: Approve and merge (merget de design-PR), Preview, Compare with vorige versie, Restore, Link to task, Open in GitHub.
- Versies leven in `design/<scherm>/v<n>.html`; een nieuwe versie komt binnen via branch `design/{screen}-v{n}` en een PR.

### Settings (per workspace)

Linker subnavigatie met vijf secties, inhoud gecentreerd op 760 px.

| Sectie | Instellingen |
| --- | --- |
| General | Naam, repository, integration branch en production branch (beide als dropdown met de branches uit de repo, zoals `development`/`develop`/`staging` en `main`/`master`/`production`), accentkleur (mint, paars, cyaan, amber), workspace verwijderen (raakt de repo niet) |
| GitHub | Account en verbinding (Reconnect), toegang, sync-interval (60 s), Sync now, board-mapping (Status-veld als dropdown en kolomnamen) |
| Agents and autopilot | Tool (Cursor CLI of Claude Code) met detectie van de CLI-versie, parallelle runs (2), autopilot aan/uit, pick-up labels (`fix`, `agent-ready`), alleen draft-PR's, pauzeren bij een open beslissing, worktree-locatie, opruimen na merge |
| MCP | Server starten met Trail (aan), lees-tools (aan), schrijf-tools (aan), welke bronnen beschikbaar zijn: docs, decisions, designs (alle aan), en of agents via MCP runs mogen starten (uit) |
| Designs and repo | Map `design/` in de repo, branchpatroon voor design-PR's, `.trail/config.yml`; geen repo-docs-sync |
| Notifications | Worktree wacht op beslissing, PR klaar voor review, sync-conflict |

Alle keuzelijsten in Settings zijn eigen dropdowns (component Select), geen tekstvelden of native selects.

### Onboarding

Verschijnt bij de eerste start en bij "Add workspace". Gecentreerd, 640 px breed, drie stappen met een voortgangsbalk; zonder zijbalken.

1. **Connect GitHub:** legt uit welke rechten nodig zijn (Issues en Projects lezen en schrijven, pull requests, repository contents) en dat Trail niets buiten de gekozen repo aanraakt.
2. **Choose a repository:** lijst met repo's als keuzerondjes, plus integration branch (`development`) en production branch (`main`). Elke repo wordt één workspace.
3. **Set up the repository:** Trail meldt wat het vond (open issues, bestaand `design/`, bestaande labels) en biedt schakelaars voor: **optioneel eenmalig** markdown uit repo-`docs/` of `.trail/docs/` **importeren naar Trail** (kopie, geen sync), labels aanmaken (`priority:*`, `agent-ready`, `fix`), mappen/commits voor `design/` en `.trail/config.yml` op `development`, en een GitHub Project voor boardkolommen. Daarna Open workspace.

Alles wat Trail aanmaakt is een gewone commit die je kunt reviewen of terugdraaien.

### New task

Popup van 720 × 720 px, geopend via New task op het dashboard of Board. Twee routes, met chat als primaire:

- **Create with chat:** je beschrijft de taak in eigen woorden (of plakt een link, `#` verwijst naar een issue) en kiest met wie je praat: Claude, Cursor CLI of Claude Code. De agent maakt een conceptissue met titel, beschrijving, acceptatiecriteria, labels en prioriteit. Er wordt niets op GitHub aangemaakt tot je kiest: Create on GitHub, Create and start in a worktree, of Edit manually.
- **Fill in manually:** titel, beschrijving in Markdown (het tekstveld groeit mee tot 320 px), type (Feature, Bug, Docs, Design), prioriteit (Urgent, High, Medium, Low, Not set), schakelaars "Ready for an agent" (voegt `agent-ready` toe) en "Start in a worktree now". Onderaan staat welke labels het issue krijgt.

### Edit doc

Opent vanuit Docs. Twee kolommen: links Markdown-editor (mono), rechts live preview. Chips **Unsaved changes** en **Saved in Trail**. Acties: Discard, Save. Geen git-commit in MVP; optioneel later **Export to `docs/trail/`** (alleen-lezen).

### Resolve decision conflict

Opent vanuit een amber conflictmelding in Decisions. De twee ADR's staan naast elkaar (id, status, pad, Context, Decision met de botsende zin gemarkeerd, hoe vaak gebruikt). Drie keuzes: de eerste houden en de tweede op Superseded zetten, andersom, of beide houden met een notitie waar elk geldt. Een paneel "What this changes" toont welke taken wachten of doorlopen. **Resolve and save** schrijft de gekozen ADR-status in Trail (SQLite).

### Resolve sync conflict

Opent vanuit de conflictmelding op een kaart of het dashboard. Tabel met per veld (State, Board column, Labels, Assignee) de GitHub-waarde en de Trail-waarde, elk met tijdstip van de laatste wijziging. Per veld kies je een kant; "Use GitHub for all" kiest alles in één keer.

### Fout- en lege staten

| Situatie | Wat de app toont | Acties |
| --- | --- | --- |
| GitHub niet bereikbaar | Amber melding, aantal wijzigingen dat wacht, tijd tot volgende poging | Retry now; doorwerken kan, wijzigingen gaan later mee |
| GitHub rate limit bereikt | Sync gepauzeerd, hervat automatisch na de wachttijd | Sync now anyway, Open settings |
| Agent-run mislukt | Rode status, testuitvoer in mono, exitcode en looptijd | Retry, Open worktree, Ask Claude why |
| Coding-tool niet gevonden | Autopilot gepauzeerd omdat de CLI ontbreekt of niet ingelogd is | Choose another tool, Show install steps |
| Leeg board | No tasks yet | New task, Import issues |
| Geen beslissingen | Nothing decided yet | New decision, Import decisions |
| Geen docs in Trail | No docs yet | New doc, Import from files (one-time) |
| Geen worktrees | Nothing is running | Start a task, Open the board |

## Agent runner en autopilot

De runner is een kleine headless service in een utility process: hij pakt taken in volgorde op, maakt per taak een worktree, draait de gekozen CLI, test en opent een draft-PR. De UI is alleen een weergave bovenop die service.

**Eén run, stap voor stap**

1. Taak komt in de queue: handmatig (Start in a worktree, Start run) of via autopilot.
2. Runner wacht op een vrij slot (standaard maximaal 2 tegelijk).
3. `git worktree add <worktreeRoot>/<issue> -b agent/<issue>-<slug> <base>` (ADR-010: worktree heet naar de taak; ADR-012: elke agent in een eigen worktree).
4. Start de CLI headless (`-p --output-format stream-json`) als child process in die map; vervolgberichten uit de chat gaan via `--resume <sessie>`. De eerste prompt wordt opgebouwd uit het issue, acceptatiecriteria en gekoppelde **Trail**-ADR/docs (MCP of IPC, niet repo-`docs/`). Backend per workspace: `cursor` of `claude`.
5. Stream output naar de chat; herken tool-acties (bestand bewerkt, tests gedraaid) voor de mono-regels en de task progress.
6. Draai het testcommando uit de config. Faalt het, dan komt dat in de chat en blijft de worktree open.
7. Push de branch en open een **draft**-PR naar de integration branch. Agents zetten een PR nooit op ready for review.
8. Na merge: worktree en lokale branch opruimen (instelbaar). De taak verhuist naar "Remote worktrees".

**Statussen van een worktree:** Queued, Running, Waiting for decision, Draft PR (review), Merged, Failed, Stopped.

**Autopilot-regels**

- Aan/uit per workspace, via de schakelaar op het Board en in Settings.
- Pakt de Todo-kolom op, één voor één: eerst op prioriteit (urgent, high, medium, low, zonder prioriteit), daarna van boven naar beneden. Volgorde aanpassen = prioriteit wijzigen of kaarten slepen binnen dezelfde prioriteit.
- Alleen issues met de pick-up labels (`fix`, `agent-ready`; ook het label `handson` staat op de wensenlijst). Het label voorkomt dat vage issues worden opgepakt.
- Een issue dat van Backlog naar Todo wordt gesleept, komt in de queue.
- Een hele epic met zijn sub-issues oppakken: na de MVP, samen met de Roadmap.
- Fix lokaal gevonden: branch vanaf en PR naar `development`. Fix op productie gevonden: hotfix-branch, PR naar `development` en daarna naar `main`.
- Pauzeert de worktree als een gekoppelde ADR nog Proposed is (instelbaar), met een notificatie.
- Blijft binnen het abonnement: maximaal het ingestelde aantal parallelle runs, plus een optionele daglimiet. Draait alleen zolang de app open is.

**Beide tools ondersteunen:** een adapter-interface `AgentBackend` met `detect()`, `start(worktree, prompt)`, `send(message)`, `stop()` en een output-parser. Eerst Cursor CLI (`cursor-agent`), daarna Claude Code (`claude`). In Settings toont Trail welke versie gevonden is (bijvoorbeeld "cursor-agent 1.4 found").

## Preview-browser en pin-commentaar

De preview is een echte Chromium-view (`WebContentsView`) die de dev-server van de worktree laadt; in commentaarmodus klik je op de pagina en gaat een pin met context direct naar de chat van de agent.

**Gedrag (uit het design)**

- Toolbar: terug, vooruit, herladen, adresbalk (`localhost:3000/sign-in`), status "Dev server running", een **Comment**-toggle (aan/uit-staat zichtbaar in accentkleur) en Open in browser.
- Trail start de dev-server per worktree op een vrije poort (commando uit de config) en stopt hem bij het sluiten.
- Comment aan: cursor wordt een crosshair. Klik plaatst een genummerde pin in accentkleur en opent direct een ruim commentaarvenster ("What should change?") met Cancel en Send to chat. Het tekstveld is meerdere regels hoog en krijgt meteen focus. Technische gegevens (element, positie) staan niet in het venster maar gaan wel mee naar de chat.
- Send to chat zet een bericht in de chat met chip "From preview comment": pinnummer, tekst, URL, positie en het aangeklikte element. De agent pakt het direct op.
- Geen aparte commentaarstrook onder de preview; de chat is de lijst van commentaren.

**Implementatie**

1. Main maakt per worktree een `WebContentsView` met `partition: 'persist:preview-<workspace>'`, `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false`.
2. De renderer meldt via IPC de rechthoek van het preview-gebied; main zet daarmee `view.setBounds()` bij elke resize. Let op DPI-schaal (Retina, Windows 125–150%): rek in CSS-pixels.
3. Een preload injecteert de overlay in een shadow DOM, zodat de CSS van de pagina er niet aan komt. Native views tekenen altijd boven de app-HTML, dus de pins en het invoerveld leven in de pagina zelf.
4. Per pin opslaan: CSS-selector, XPath, tekst van het element, offset binnen de bounding box, viewport-grootte, URL en tijd. Geen ruwe x/y alleen, zodat pins een reflow overleven.
5. Optioneel een uitsnede via `webContents.capturePage(rect)` als bijlage bij de pin.
6. Payload gaat via `contextBridge` naar main, die hem in SQLite opslaat en in de chat van die worktree zet.
7. Later: Chrome DevTools Protocol via `webContents.debugger` voor DOM-snapshots en zodat een agent de pagina zelf kan bedienen.

Pins zijn ook beschikbaar als MCP-resources (zie MCP-server), zodat Cursor of Claude open pins kan lezen en afvinken. Dit is dezelfde techniek die Loupe later als Chrome-extensie nodig heeft.

## MCP-server

Trail draait een lokale MCP-server in de main process, zodat Cursor, Claude Code, Claude en ChatGPT de productcontext van elke workspace kunnen lezen zonder dat die in elke repo gekopieerd hoeft te worden.

- **Transport:** stdio (Trail levert een klein `trail-mcp`-commando dat met de draaiende app praat) en Streamable HTTP op `127.0.0.1` met een lokaal token.
- **Taakverdeling:** coding-agents in een worktree lezen **code** uit de worktree. **Productkennis** (docs, ADR's, beslissingen over meerdere workspaces) via **Trail MCP**. MCP schrijft (fase 2) naar Trail, niet naar repo-`docs/`.
- **Fase 1, lezen:** `list_workspaces`, `list_tasks`, `get_task`, `list_decisions`, `get_decision`, `search_docs`, `list_open_pins`.
- **Fase 2, schrijven:** `create_decision` (met controle op conflicten met bestaande ADR's), `update_task_status`, `resolve_pin`, `add_task_comment`.
- **Resources:** `trail://<workspace>/decisions/<id>`, `trail://<workspace>/knowledge/<doc-id>`, `trail://<workspace>/designs/<screen>/v<n>`, `trail://<workspace>/pins/<worktree>`.
- **Installatie:** een knop in Settings die de config voor Cursor (`.cursor/mcp.json`) en Claude Code toont of schrijft, na bevestiging.
- **Instellingen:** per workspace een MCP-sectie in Settings met schakelaars voor de server zelf, lees-tools, schrijf-tools, welke bronnen (docs, decisions, designs) open staan, en of agents via MCP runs mogen starten (standaard uit). Schrijf-tools staan in het design standaard aan; elke schrijfactie verschijnt wel in Activity.

## Design system en UI-regels

Bouw alle UI op het [Trail Design System](https://claude.ai/artifact/JsFXJa3hm4D9YfFJjtbb3B): de tokens worden CSS-variabelen, de 20 componenten worden React-componenten met Storybook-stories.

**Tokens (dark, het enige thema)**

| Groep | Waarden |
| --- | --- |
| Ondergronden | bg `#0b0d10`, surface `#0e1115`, surface-raised `#12151a`, surface-card `#161a20`, surface-hover `#181c22` |
| Lijnen | line-soft `#1a1f25`, line `#1f242b`, line-strong `#2a313a` |
| Tekst | ink `#e7e9ec`, ink-soft `#c3cad2`, ink-muted `#98a2af`, ink-faint `#8b95a1` |
| Merk / standaard-accent | mint `#4af7a3`, mint-soft `#0f2219`, mint-line `#1c4733`, on-mint `#04140c` |
| Status | amber `#f2b24c` (aandacht), blue `#7fb6ff` (proposed, Todo), violet `#c9a7ff` (review, GitHub), red `#ff8a7a` (fout), claude `#e0956b` |
| Type | Inter (sans) en JetBrains Mono; title-lg 26, title 20, heading 15, body 14, small 13, caption 12, overline 11, mono 12 |
| Spacing | 4, 8, 12, 16, 20, 24, 32, 44 px |
| Radius | 6, 10, 14 px en pill |
| Focus | 2 px gat in paginakleur + 2 px ring in accentkleur |

**Componenten om te bouwen:** Button, Chip, Avatar, StatTile, Panel, ConflictBanner, KanbanCard, KanbanColumn, DecisionRow, ActivityItem, RoadmapBar, SyncStatus, SelectButton, SegmentedControl, Toggle, SearchField, DataTable, Kbd, FilterPill, Select (eigen dropdown met vinkje, geen native select), PriorityIndicator (gekleurde balk links op de kaart plus drie staafjes) en ChatComposer met keuze voor agent en modus. Nog te ontwerpen en ook nodig: Menu, Tabs, Tooltip, Toast, Modal, formulierlayout, lege staat, Skeleton, command palette en de app-shell.

**Regels**

- Eén primaire knop per view, in de accentkleur van de workspace. Tekst op een accentvlak is `on-accent`, nooit wit.
- Statuskleur altijd samen met een tekstlabel (rood en amber zijn nooit de enige drager).
- Bundel Inter en JetBrains Mono lokaal in de app (geen Google Fonts-call), zodat de app offline werkt.
- Compacte desktopmaten zoals in het design: knoppen 30 px hoog, tabs en titelbalk 36 px, statusbalk 24 px. Klikdoelen blijven toegankelijk via toetsenbord en focus-ring.
- Minimale venstergrootte 1180 × 640 px.
- Scrollbalken dun en donker; geen native lichte scrollbalken op Windows.
- De UI-taal is Engels, zoals in het design.

## Packaging, signing en auto-update

Eén GitHub Actions-workflow bouwt bij elke tag een gesigneerde DMG voor macOS en een gesigneerde NSIS-installer voor Windows, publiceert ze als GitHub Release en voedt daarmee de auto-update.

|  | macOS | Windows |
| --- | --- | --- |
| Architecturen | arm64 en x64 **apart** (geen universal-build) | x64 (arm64 later) |
| Installer | DMG + ZIP (ZIP is nodig voor auto-update) | NSIS, per gebruiker, zonder admin-rechten |
| Signing | Apple Developer ID Application-certificaat, hardened runtime | Azure Artifact Signing (voorheen Trusted Signing) of een OV-certificaat |
| Extra stap | Notarisatie via `notarytool` (Apple ID of API-key) | SmartScreen-reputatie bouwt zich op na verloop van tijd |
| Runner in CI | `macos-latest` | `windows-latest` |
| Auto-update | electron-updater via GitHub Releases | electron-updater via GitHub Releases |
| Minimale OS-versie | Volg de Electron-versie (huidig macOS 12+) | Windows 10 en 11 |

**Aandachtspunten**

- electron-builder kiest de Windows-signing via `win.azureSignOptions` voor Azure, en kan Windows-builds ook vanaf macOS of Linux signeren ([electron-builder Windows signing](https://www.electron.build/docs/features/code-signing/code-signing-win)). Microsoft zegt zelf dat Azure-signing geen directe SmartScreen-vertrouwen geeft; reputatie groeit pas met downloads ([electron-builder code signing](https://www.electron.build/docs/features/code-signing/)).
- Azure Artifact Signing is sinds januari 2026 algemeen beschikbaar in onder meer Europa ([DevClass](https://www.devclass.com/security/2026/01/14/code-signing-windows-apps-may-be-easier-and-more-secure-with-new-azure-artifact-service/4079554)), dus bruikbaar vanuit een Nederlandse BV.
- macOS-entitlements: netwerk-client en -server (lokale MCP en dev-server), en `allow-jit` voor V8. Geen camera of microfoon nodig.
- Native modules (better-sqlite3, node-pty) worden per platform en architectuur opnieuw gebouwd met `@electron/rebuild`; test de arm64- en x64-build apart.
- Electron ondersteunt alleen de laatste 3 stabiele majors en brengt elke 8 weken een nieuwe uit ([Electron Releases](https://electronjs.org/docs/latest/tutorial/electron-timelines)). Plan elk kwartaal een Electron-upgrade.
- Updatekanaal: `latest` voor eigen gebruik, een `beta`-kanaal is optioneel. Updates downloaden op de achtergrond en installeren bij herstart; nooit midden in een lopende agent-run.
- Crash-rapportage met de ingebouwde `crashReporter` naar een eigen endpoint of Sentry, standaard uit tot je het aanzet.

## Security

Trail draait agents met schrijfrechten op je code en laadt willekeurige pagina's naast een app met GitHub-toegang, dus de grenzen tussen die delen moeten hard zijn.

- **Renderer:** `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`, strikte CSP, geen `remote`-module. Alleen een minimale, getypte `contextBridge`-API.
- **IPC:** elk kanaal met een zod-schema; main controleert `event.senderFrame` en weigert berichten uit de preview- of design-views op app-kanalen.
- **Preview en designs:** eigen `partition` per workspace, geen toegang tot de app-cookies of het GitHub-token. Navigatie buiten de ingestelde dev-URL opent in de systeembrowser. Design-HTML draait in een sandbox zonder netwerk naar buiten, behalve fonts.
- **Secrets:** GitHub-token via OAuth device flow of een fine-grained PAT, opgeslagen met Electron `safeStorage` (Keychain op macOS, DPAPI op Windows). Nooit in SQLite of logs.
- **GitHub-scopes:** alleen de gekozen repo's: issues, pull requests, contents, Projects. Geen org-brede rechten.
- **Agents:** draaien alleen in hun eigen worktree-map. Geen automatische merge; alleen draft-PR's. Een kill-switch (Stop) per run en een globale "Pause autopilot".
- **MCP:** alleen op `127.0.0.1`, met een token dat per installatie wordt aangemaakt. Schrijf-tools pas in fase 2 en met bevestiging in de UI.
- **Updates:** alleen gesigneerde builds; electron-updater controleert de handtekening.

## Testen en acceptatiecriteria

De MVP is af als onderstaande checks op een schone Mac (Apple Silicon) en een schone Windows 11-machine slagen met de geïnstalleerde, gesigneerde build. **Prestatie-acceptatie** (bundle/installer CI, koude start, geheugen, smooth chat-scroll, diagnostics): [prestatiebriefing — Acceptatiecriteria](./2026-11-18-trail-desktop-performance-briefing.md#acceptatiecriteria).

**Teststrategie**

- Unit (Vitest): sync-logica, mapping Status-veld → kolom, queue-volgorde, pin-anker-resolutie, config-parsing.
- Integratie: een test-repo op GitHub met vaste issues, en een nep-`AgentBackend` die een voorspelbare run afspeelt.
- End-to-end (Playwright met Electron): app starten, workspace wisselen, kaart slepen, run starten, preview openen, pin plaatsen.
- Handmatig per release: installeren, updaten en verwijderen op beide platformen, plus multi-monitor en 125–150% schaal op Windows.

**Acceptatiecriteria**

- [ ] Installer downloaden en installeren op macOS en Windows zonder Gatekeeper-blokkade; SmartScreen-melding hooguit in de eerste weken.
- [ ] Een repo koppelen en binnen 60 seconden staan issues in de juiste boardkolom.
- [ ] Workspace wisselen met Ctrl/Cmd+2 herkleurt de hele app en toont de data van die repo.
- [ ] Een kaart van Todo naar In progress slepen past het Status-veld op GitHub aan.
- [ ] Met autopilot aan pakt Trail de bovenste Todo-kaart met label `agent-ready` op, maakt een worktree en start Cursor CLI.
- [ ] Er draaien nooit meer runs tegelijk dan de ingestelde limiet; de rest staat op Queued.
- [ ] Een geslaagde run levert een draft-PR naar `development` op en de taak verschijnt onder Remote worktrees.
- [ ] Een taak met een Proposed ADR pauzeert met "Waiting for decision" en gaat verder na Accept.
- [ ] In Preview geeft een klik met Comment aan een pin, en Send to chat zet die met URL en element in de chat.
- [ ] Open in Cursor opent de juiste worktree-map in Cursor.
- [ ] Een design-HTML uit `design/` toont volledig scherm, met versiegeschiedenis.
- [ ] Cursor kan via MCP `list_tasks` en `get_decision` aanroepen voor de actieve workspace.
- [ ] Een nieuwe versie wordt via auto-update geïnstalleerd zonder een lopende run af te breken.
- [ ] Command palette vindt pagina's, taken, ADR's en docs; elke icoonknop heeft een eigen tooltip.
- [ ] Onboarding koppelt GitHub, kiest een repo en kan labels + `.trail/config.yml` / `design/` op `development` zetten (geen verplichte repo-`docs/`-sync).
- [ ] New task via chat levert een conceptissue; pas na Create on GitHub bestaat het issue, met `priority:*`-label.
- [ ] Kaarten in Todo staan op prioriteit; autopilot pakt een `priority:urgent`-kaart vóór een `priority:low`-kaart op.
- [ ] Een sync-conflict is per veld op te lossen; de gekozen waarden staan daarna op GitHub.
- [ ] Zonder netwerk blijft de app bruikbaar en verschijnt de melding "GitHub is not reachable".

## Fasering en milestones

Bouw in vijf fases; elke fase eindigt met een gesigneerde build die op beide platformen installeert, zodat platformproblemen vroeg opduiken.

&#91;embedded content: MVP-fasering · 5 fases, elk met een gate\]

Signing en auto-update staan bewust in fase 0: notarisatie en native modules zijn de grootste platformrisico's en kosten het meeste tijd als ze pas aan het eind komen. In dezelfde fase: electron-builder op gebundelde `out/`, CI-groottebudgetten en snelle eerste paint (zie [prestatiebriefing — Koppeling aan MVP-fasering](./2026-11-18-trail-desktop-performance-briefing.md#koppeling-aan-mvp-fasering) en [fase 0 plan](../plans/2026-11-18-trail-desktop-phase-0.md)). Geen datums, want de beschikbare tijd (één dag per week plus vrije tijd) is nog niet per fase gepland.

## Open vragen en aannames

**Aannames in deze briefing**

- React als UI-framework, omdat de Storybook-stories van het design system al voor React (CSF 3) zijn geschreven.
- electron-builder in plaats van Electron Forge, vanwege de ingebouwde auto-updater; Forge is het officieel ondersteunde alternatief.
- De integration branch heet `development` en productie `main`, zoals in het design.
- Bestaande ADR-nummers uit het design (ADR-010 t/m 012) zijn voorbeelddata en worden de eerste echte ADR's van Trail zelf.

**Open vragen**

- [ ] Appnaam en bundle-id: is "Trail" vrij genoeg (domein, conflicten in App Store en Microsoft Store), en wordt het bundle-id `nl.derisoryventures.trail` of `com.derisoryventures.trail`?
- [ ] Apple Developer-account op naam van Derisory Ventures B.V. (vereist een D-U-N-S-nummer) en identiteitsvalidatie van de BV bij Azure Artifact Signing.
- [ ] Daglimiet voor autopilot: een aantal runs per dag of een tijdvenster?
- [ ] Waar komen de acceptatiecriteria vandaan: een vaste sectie in de issue-body (bijvoorbeeld `## Acceptance criteria` met checkboxes)?
- [ ] Designs: hoe komt een Claude Design-export in `design/`? Handmatig exporteren, of een import-knop in Trail? De losse claude.ai/design-app sluit volgens eerdere bronnen op 14 december 2026; exporteer bestaande designs vóór die datum.
- [ ] Roadmap/epics: welke GitHub-structuur (milestones, sub-issues of Projects-velden) gaat de latere Roadmap voeden?

**Besloten op 18 november**

- Uitgever in beide certificaten en in de app-metadata: **Derisory Ventures B.V.**
- Dev- en testcommando: Trail leest ze automatisch uit het project (`package.json`-scripts zoals `dev` en `test`, of een Makefile) en toont ze ter bevestiging bij het toevoegen van een workspace. Overschrijven kan in `.trail/config.yml`.
- Agent-uitvoer: beide CLI's draaien in headless/print-modus met `--output-format stream-json` (regel-voor-regel JSON-events). Trail leest die events, niet de tekst die de CLI op het scherm zet. Elke run krijgt een timeout, omdat de headless modus van de Cursor CLI soms blijft hangen.
- Releases komen voorlopig in een publieke GitHub-repo; electron-updater leest daar direct de nieuwste release, zonder token of eigen update-server.
