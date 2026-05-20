/**
 * Blocks until the Trail API responds (used before starting Vite in dev:all).
 */
const port = process.env.TRAIL_API_PORT ?? "4700";
const url = `http://127.0.0.1:${port}/api/config`;
const timeoutMs = Number(process.env.TRAIL_API_WAIT_MS) || 120_000;
const intervalMs = 250;

const start = Date.now();

while (Date.now() - start < timeoutMs) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`Trail API ready at ${url}`);
      process.exit(0);
    }
  } catch {
    // API still starting (CLI build + tsx boot)
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(
  `Timed out after ${timeoutMs}ms waiting for Trail API at ${url}.`,
);
process.exit(1);
