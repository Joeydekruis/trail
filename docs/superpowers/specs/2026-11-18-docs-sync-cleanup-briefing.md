# Briefing: opschonen van de oude Trail (docs-sync met GitHub)

**Status:** in uitvoering · legacy code verwijderd 18 nov 2026 · desktop briefing bijgewerkt (ADR-008)

## Context

De eerste opzet van Trail was een vervanger voor de `/docs`-map per product, met een tweerichtings-sync tussen Trail en de docs-map in de repo (via GitHub). Trail is inmiddels een orchestrator geworden: PM-overzicht over GitHub Issues, lokale runner (Cursor/Claude), desktop-app (Electron) plus web. Agents lezen kennis via MCP rechtstreeks uit Trail.

## Beslissing

- Geen tweerichtings-sync meer tussen Trail en een docs-map in de repo.
- Trail is de enige bron voor kennis (ADRs, beslissingen, ideeën, docs).
- GitHub Issues blijven de bron voor taken.
- Wel behouden, later en optioneel: een eenrichtings-export (Trail naar repo, alleen-lezen) en een eenmalige import van bestaande `/docs`-mappen.

Reden: tweerichtings-sync geeft conflicten en merge-ruis, dubbele bron van waarheid, en is voor de solo-MVP veel werk voor weinig winst.

## Doel van de opschoning

Alle code, UI, copy en documentatie die uitgaat van "sync je docs-map met GitHub" verwijderen of herformuleren, zonder de GitHub-integratie voor issues, worktrees en releases te raken.

## Scope

**In scope (verwijderen of aanpassen)**

- Sync-logica voor docs-map, zoals file watchers, pull/push van markdown, conflictafhandeling en sync-status.
- Datamodel-velden en migraties die alleen voor sync dienen (bijvoorbeeld pad in repo, laatste sync-commit, sync-hash).
- UI: sync-knoppen, statusindicatoren, instellingen en onboarding-stappen over "docs syncen".
- Copy: projectomschrijving, landingspagina en README-teksten zoals "syncing docs folder helps you stay locally up to date".
- MCP-tools of endpoints die alleen de sync bedienen.
- Tests, seed-data en feature flags die daarbij horen.

**Buiten scope (niet aanraken)**

- GitHub Issues-integratie (lezen, labels, Backlog/Todo, autopilot).
- Worktrees en remote worktrees, de runner en de Cursor/Claude-koppeling.
- Release-flow van de desktop-app via de publieke GitHub-repo.
- Authenticatie met GitHub.

## Aanpak

1. **Inventariseren (alleen lezen).** Zie [2026-11-18-docs-sync-inventory.md](./2026-11-18-docs-sync-inventory.md).
2. **Afhankelijkheden checken.** Controleer of iets uit de sync-code wordt hergebruikt door issues, worktrees of de runner.
3. **Beslissing vastleggen.** [ADR-008](../../adr/008-trail-single-source-knowledge.md).
4. **Verwijderen in kleine PR's.** Volgorde: UI en copy, dan MCP/endpoints, dan backend-logica, dan datamodel en migraties.
5. **Datamigratie.** Zet bestaande docs-inhoud in Trail zeker voordat velden of tabellen verdwijnen.
6. **Documentatie bijwerken.** O.a. desktop-briefing secties over `docs/`-twee-weg sync (zie design index).
7. **Opruimen.** Ongebruikte dependencies, feature flags, environment-variabelen en CI-stappen.

## Eenrichtings-export (later, optioneel)

- Trail genereert markdown (ADRs en beslissingen) naar een vaste map zoals `docs/trail/` of een `AGENTS.md`.
- Alleen-lezen: bovenaan elk bestand een melding "Gegenereerd door Trail, niet handmatig bewerken".
- Niet in de MVP.

## Definition of done

- Geen verwijzingen meer naar docs-map-sync in code, UI, copy of documentatie.
- Bouw en tests slagen; issues, worktrees, runner en releases werken ongewijzigd.
- Bestaande docs-inhoud staat in Trail en is gecontroleerd.
- ADR is vastgelegd.

## Risico's

- Gedeelde code tussen sync en issue-integratie wordt per ongeluk verwijderd.
- Dataverlies bij het droppen van velden.
- Verwijzingen in oude specs (18 nov desktop briefing) blijven achter.

## Open vragen

- Is er al data of gebruik van de sync buiten Joey zelf?
- Willen we de eenrichtings-export al in deze ronde, of pas na de MVP?