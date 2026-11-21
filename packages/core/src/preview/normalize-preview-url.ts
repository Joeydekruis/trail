const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export type NormalizePreviewUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Ensures worktree preview URLs are safe http(s) targets (local dev servers). */
export function normalizePreviewUrl(raw: string): NormalizePreviewUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Preview URL is required" };
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, message: "Invalid preview URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Preview URL must use http or https" };
  }

  if (parsed.protocol === "https:" && !LOCAL_HOSTS.has(parsed.hostname)) {
    return { ok: false, message: "Only local https preview URLs are allowed in MVP" };
  }

  if (
    parsed.protocol === "http:" &&
    !LOCAL_HOSTS.has(parsed.hostname) &&
    parsed.hostname !== "0.0.0.0"
  ) {
    return { ok: false, message: "Preview URL must target localhost in MVP" };
  }

  return { ok: true, url: parsed.toString() };
}

export const DEFAULT_PREVIEW_URL = "http://127.0.0.1:3000/";