/**
 * Discriminated union of Trail CLI errors. Narrow on `code` for type-safe handling.
 */
export type TrailErrorCode =
  | "AUTH_REQUIRED"
  | "AUTH_FAILED"
  | "NOT_A_TRAIL_REPO"
  | "VALIDATION_FAILED"
  | "GITHUB_API"
  | "SYNC_CONFLICT";

export type TrailError =
  | { code: "AUTH_REQUIRED"; message: string; hint?: string }
  | { code: "AUTH_FAILED"; message: string }
  | { code: "NOT_A_TRAIL_REPO"; message: string; path?: string }
  | {
      code: "VALIDATION_FAILED";
      message: string;
      details?: string;
      issues?: string[];
    }
  | { code: "GITHUB_API"; message: string; status?: number; body?: string }
  | { code: "SYNC_CONFLICT"; message: string; paths?: string[] };

/**
 * Human-readable text for CLI stderr: `[CODE] message`, with optional extra lines.
 */
export function formatTrailError(error: TrailError): string {
  const lines: string[] = [`[${error.code}] ${error.message}`];

  switch (error.code) {
    case "AUTH_REQUIRED": {
      if (error.hint) {
        lines.push(error.hint);
      }
      break;
    }
    case "AUTH_FAILED": {
      break;
    }
    case "NOT_A_TRAIL_REPO": {
      if (error.path) {
        lines.push(`Path: ${error.path}`);
      }
      break;
    }
    case "VALIDATION_FAILED": {
      if (error.details) {
        lines.push(error.details);
      }
      if (error.issues && error.issues.length > 0) {
        for (const issue of error.issues) {
          lines.push(`  - ${issue}`);
        }
      }
      break;
    }
    case "GITHUB_API": {
      if (error.status !== undefined) {
        lines.push(`HTTP status: ${error.status}`);
      }
      if (error.body) {
        lines.push(error.body);
      }
      break;
    }
    case "SYNC_CONFLICT": {
      if (error.paths && error.paths.length > 0) {
        lines.push(`Paths: ${error.paths.join(", ")}`);
      }
      break;
    }
    default: {
      const _exhaustive: never = error;
      return _exhaustive;
    }
  }

  return lines.join("\n");
}
