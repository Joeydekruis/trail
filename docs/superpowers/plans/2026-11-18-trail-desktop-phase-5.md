# Trail Desktop — fase 5 (MVP afronding) — gestart

**Goal:** Meet performance acceptatiecriteria met CI-achtige checks en een debug-paneel voor release.

**Status:**

- [x] Performance budgets gedeeld in `@trail/core` (cold start 2,5 s CI, workspace switch 150 ms)
- [x] Startup timing in main + renderer ready mark
- [x] Help → Diagnostics (CPU/geheugen per proces, SQLite-grootte, timings, open views)
- [x] Playwright Electron smoke (`npm run test:e2e --workspace=@trail/desktop` na build)
- [x] E2E-flows (board drag, agent run, preview mode) via `TRAIL_E2E` seed + Playwright
- [ ] Preview pin plaatsen in E2E — WebContentsView + overlay (volgt)

**Verificatie**

- `npm test` + `npm run typecheck`
- `npm run build --workspace=@trail/desktop && npm run test:e2e --workspace=@trail/desktop`
- Handmatig: **Help** → Diagnostics na workspace-wissel (Cmd/Ctrl+2)