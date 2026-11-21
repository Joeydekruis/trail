export function withIfNoneMatch(
  headers: HeadersInit,
  etag: string | null | undefined,
): HeadersInit {
  if (!etag?.trim()) {
    return headers;
  }
  if (headers instanceof Headers) {
    const next = new Headers(headers);
    next.set("If-None-Match", etag);
    return next;
  }
  if (Array.isArray(headers)) {
    return [...headers, ["If-None-Match", etag]];
  }
  return { ...headers, "If-None-Match": etag };
}

export function etagFromResponse(headers: Headers): string | null {
  const value = headers.get("ETag");
  return value?.trim() ? value : null;
}