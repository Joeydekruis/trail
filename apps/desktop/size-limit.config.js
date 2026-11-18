/**
 * Fase 0 budgets — see docs/superpowers/specs/2026-11-18-trail-desktop-performance-briefing.md
 * Nulmeting (lege shell, 2026-11): renderer JS ~97 KB gzip.
 */
module.exports = [
  {
    name: "First screen renderer JS (gzip)",
    path: "out/renderer/assets/index-*.js",
    limit: "400 KB",
    gzip: true,
  },
  {
    name: "First screen renderer CSS (gzip)",
    path: "out/renderer/assets/index-*.css",
    limit: "50 KB",
    gzip: true,
  },
];