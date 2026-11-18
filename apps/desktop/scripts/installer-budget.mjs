/** @typedef {{ maxDeltaBytes?: number; maxPercentIncreasePerRelease?: number }} InstallerBudgetOptions */

/**
 * @param {number} actualBytes
 * @param {number | null | undefined} baselineBytes
 * @param {InstallerBudgetOptions} [options]
 */
export function compareInstallerSize(actualBytes, baselineBytes, options = {}) {
  const maxDelta = options.maxDeltaBytes ?? 15 * 1024 * 1024;
  const maxPercent = options.maxPercentIncreasePerRelease ?? 0.05;

  if (baselineBytes == null || baselineBytes <= 0) {
    return { ok: true, reason: "no_baseline" };
  }

  const delta = actualBytes - baselineBytes;
  const percent = delta / baselineBytes;

  if (delta > maxDelta) {
    return { ok: false, reason: "delta_bytes", delta, maxDelta, baselineBytes, actualBytes };
  }
  if (percent > maxPercent) {
    return {
      ok: false,
      reason: "delta_percent",
      percent,
      maxPercent,
      baselineBytes,
      actualBytes,
    };
  }

  return { ok: true, delta, percent, baselineBytes, actualBytes };
}