import type { WorkspaceAccent } from "./types.js";

/** Default accent palettes (matches demo seed). */
export const WORKSPACE_ACCENTS: readonly WorkspaceAccent[] = [
  {
    accent: "#4af7a3",
    accentSoft: "#0f2219",
    accentLine: "#1c4733",
    onAccent: "#04140c",
  },
  {
    accent: "#b26bff",
    accentSoft: "#1b1230",
    accentLine: "#3b2766",
    onAccent: "#12071f",
  },
  {
    accent: "#3dd6f5",
    accentSoft: "#0e2229",
    accentLine: "#1b4553",
    onAccent: "#04141a",
  },
] as const;

export function accentForSortOrder(sortOrder: number): WorkspaceAccent {
  const palette = WORKSPACE_ACCENTS[sortOrder % WORKSPACE_ACCENTS.length];
  return palette ?? WORKSPACE_ACCENTS[0];
}