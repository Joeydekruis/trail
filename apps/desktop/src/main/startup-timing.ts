let appReadyAt: number | null = null;
let windowShownAt: number | null = null;
let rendererReadyAt: number | null = null;
let lastWorkspaceSwitchMs: number | null = null;

export function markAppReady(at: number = Date.now()): void {
  appReadyAt = at;
}

export function markWindowShown(at: number = Date.now()): void {
  windowShownAt = at;
}

export function markRendererReady(at: number = Date.now()): void {
  rendererReadyAt = at;
}

export function recordWorkspaceSwitchDuration(durationMs: number): void {
  if (Number.isFinite(durationMs) && durationMs >= 0) {
    lastWorkspaceSwitchMs = Math.round(durationMs);
  }
}

export function getStartupTimingSnapshot(): {
  appReadyAt: number | null;
  windowShownAt: number | null;
  rendererReadyAt: number | null;
  coldStartMs: number | null;
  lastWorkspaceSwitchMs: number | null;
} {
  const coldStartMs =
    appReadyAt !== null && rendererReadyAt !== null
      ? Math.max(0, rendererReadyAt - appReadyAt)
      : null;
  return {
    appReadyAt,
    windowShownAt,
    rendererReadyAt,
    coldStartMs,
    lastWorkspaceSwitchMs,
  };
}