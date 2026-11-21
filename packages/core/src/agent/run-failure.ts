const TEST_OUTPUT_PATTERN =
  /\b(test|tests|vitest|jest|mocha|FAIL|failed|failure|npm ERR!|AssertionError)\b/i;

/** Compact run time for failure banners. */
export function formatAgentRunDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return "unknown duration";
  }
  if (durationMs < 1_000) {
    return `${Math.round(durationMs)}ms`;
  }
  const totalSec = Math.floor(durationMs / 1_000);
  if (totalSec < 60) {
    return `${totalSec}s`;
  }
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

/** Pick test-related lines when present; otherwise tail of recent CLI output. */
export function summarizeAgentRunOutput(lines: string[], maxLines = 6): string | null {
  const trimmed = lines.map((line) => line.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    return null;
  }
  const testish = trimmed.filter((line) => TEST_OUTPUT_PATTERN.test(line));
  const source = testish.length > 0 ? testish : trimmed;
  const tail = source.slice(-maxLines);
  return tail.join("\n");
}

export function buildAskAgentWhyPrompt(input: {
  issueNumber: number;
  exitCode: number;
  outputSummary: string | null;
}): string {
  const parts = [
    `Why did the agent run for issue #${input.issueNumber} fail with exit code ${input.exitCode}?`,
    "Summarize the likely root cause and suggest a concrete fix.",
  ];
  if (input.outputSummary?.trim()) {
    parts.push("", "Recent output:", input.outputSummary.trim());
  }
  return parts.join("\n");
}