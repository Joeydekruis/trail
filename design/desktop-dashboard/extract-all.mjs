import { spawnSync } from "node:child_process";

/** Screen UUIDs from v1.html `__bundler/page_order` + template section titles. */
const SCREENS = [
  ["8329b86c-1d48-4b6f-b311-8d94ba5da487", "dashboard"],
  ["3a01bcfc-beb3-4dde-bd60-d2dab52e0f21", "board"],
  ["247f0e5e-f060-4b7a-a2dc-d8091df667b1", "onboarding"],
  ["a0830f1f-76e0-4740-a0b3-10c54154f011", "roadmap"],
  ["ae7deefb-9fad-47ea-8be3-fb7f06806453", "decisions"],
  ["dfea6204-d757-4f81-8101-80bf30edcf3d", "new-task"],
  ["f328358e-aec8-42d2-86b7-a01cdef4680d", "docs"],
  ["9aa36bd5-f28a-4237-8623-08357365ac03", "settings"],
  ["9cfc62ce-55ff-4935-8dae-cea02854f9f7", "edit-doc"],
  ["4006403f-a8e5-469b-a3ba-d6bf5fa0ebdb", "designs"],
  ["ecc0285d-a534-4b1e-85fb-7f24b53d7dc3", "worktree"],
  ["572f841a-c715-46e3-ae59-356fdbb78d27", "resolve-decision"],
  ["7af17834-e0f2-4a23-802c-3b70efc98a65", "resolve-sync"],
  ["21bdd96a-2276-47b5-94f0-0fe772df5b21", "errors-empty"],
];

for (const [id, name] of SCREENS) {
  const r = spawnSync("node", ["design/desktop-dashboard/extract-deepest.mjs", id, name], {
    stdio: "inherit",
    shell: false,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log("extracted", SCREENS.length, "screens");