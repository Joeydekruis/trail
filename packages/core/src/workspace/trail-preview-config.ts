import { DEFAULT_PREVIEW_URL } from "../preview/normalize-preview-url.js";

export type TrailPreviewConfig = {
  devCommand: string;
  url: string;
};

/** Parses the `preview:` block from `.trail/config.yml` (minimal, no full YAML). */
export function parseTrailPreviewConfigYaml(text: string): TrailPreviewConfig | null {
  const lines = text.split(/\r?\n/);
  let inPreview = false;

  const values: Partial<TrailPreviewConfig> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inPreview) {
      if (/^preview:\s*$/i.test(line) || /^preview:\s*$/i.test(trimmed)) {
        inPreview = true;
      }
      continue;
    }

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    if (/^\S/.test(line) && !line.startsWith(" ")) {
      break;
    }

    const match = line.match(/^\s+(devCommand|url):\s*(.+?)\s*$/);
    if (!match) {
      continue;
    }
    const key = match[1] as keyof TrailPreviewConfig;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  if (!values.devCommand?.trim() || !values.url?.trim()) {
    return null;
  }

  return {
    devCommand: values.devCommand.trim(),
    url: values.url.trim(),
  };
}

export function previewConfigFromPackageJsonScripts(
  scripts: Record<string, string> | undefined,
): TrailPreviewConfig | null {
  if (!scripts?.dev?.trim()) {
    return null;
  }
  return {
    devCommand: "npm run dev",
    url: DEFAULT_PREVIEW_URL,
  };
}

export function preferredPortFromPreviewUrl(url: string): number {
  try {
    const parsed = new URL(url.includes("://") ? url : `http://${url}`);
    if (parsed.port) {
      const port = Number.parseInt(parsed.port, 10);
      if (Number.isFinite(port) && port > 0) {
        return port;
      }
    }
  } catch {
    // fall through
  }
  return 3000;
}

export function previewUrlWithPort(url: string, port: number): string {
  const candidate = url.includes("://") ? url : `http://${url}`;
  const parsed = new URL(candidate);
  parsed.hostname = parsed.hostname || "127.0.0.1";
  parsed.port = String(port);
  return parsed.toString();
}