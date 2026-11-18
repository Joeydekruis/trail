import fs from "node:fs";

const html = fs.readFileSync(
  "design/desktop-dashboard/extracted/dashboard-resolved.html",
  "utf8",
);

const utilMatch = html.match(
  /body \{ margin: 0; background: var\(--bg\)([\s\S]*?)\.tr-select[^}]+\}/,
);
const helmetMatch = html.match(/<helmet>\s*<style>([\s\S]*?)<\/style>/);

let out = `/* Extracted from design/desktop-dashboard/v1.html — Dashboard screen */\n\n`;
if (utilMatch) {
  out += `body { margin: 0; background: var(--bg);${utilMatch[1]}.tr-select { min-height: 44px; padding: 0 12px; border-radius: var(--radius-md); border: 1px solid var(--line-strong); background: var(--surface-raised); color: var(--ink); font: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }\n\n`;
}
if (helmetMatch) {
  out += `/* Screen density overrides */\n${helmetMatch[1]}\n`;
}

const dest = "apps/desktop/src/renderer/src/trail-design.css";
fs.writeFileSync(dest, out);
console.log("wrote", dest, out.length);