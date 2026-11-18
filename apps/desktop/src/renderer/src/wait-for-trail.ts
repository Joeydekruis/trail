export function isElectronRenderer(): boolean {
  return (
    typeof navigator !== "undefined" &&
    navigator.userAgent.includes("Electron")
  );
}

type TrailBridge = NonNullable<typeof window.trail>;

export function waitForTrail(
  timeoutMs = 3000,
  intervalMs = 50,
): Promise<TrailBridge | undefined> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      const api = window.trail;
      if (api) {
        resolve(api);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        resolve(undefined);
        return;
      }
      window.setTimeout(tick, intervalMs);
    };
    tick();
  });
}