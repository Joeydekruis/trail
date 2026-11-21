/** Best-effort version string from CLI `--version` output. */
export function parseAgentVersionOutput(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }
  const semver = /(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/.exec(trimmed);
  if (semver) {
    return semver[1];
  }
  const firstLine = trimmed.split("\n").find((line) => line.trim().length > 0);
  return firstLine?.trim() ?? null;
}