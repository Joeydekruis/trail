/** Normalizes task ref paths to `.trail/docs`-relative form. */
export function normalizeDocRefPath(refPath: string): string {
  return refPath
    .replace(/^\.trail\/docs\//, "")
    .replace(/^docs\//, "");
}

export function docRefMatches(docPath: string, refPath: string): boolean {
  const norm = normalizeDocRefPath(refPath);
  return norm === docPath || refPath === docPath;
}

export function docRefForPath(docPath: string): { type: "doc"; path: string } {
  return { type: "doc", path: docPath };
}
