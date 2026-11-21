export type DesignVersionDto = {
  version: string;
  relativePath: string;
};

export type DesignScreenDto = {
  id: string;
  name: string;
  versions: DesignVersionDto[];
};

function screenLabelFromId(id: string): string {
  return id
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function versionFromFile(fileName: string): string {
  const match = /^v(\d+)\.html$/i.exec(fileName);
  if (match) {
    return `v${match[1]}`;
  }
  return fileName.replace(/\.html$/i, "");
}

/** Groups `design/` HTML paths into screens (top-level folder) with versions. */
export function buildDesignCatalog(relativePaths: string[]): DesignScreenDto[] {
  const byScreen = new Map<string, DesignVersionDto[]>();

  for (const rel of relativePaths) {
    const normalized = rel.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (parts.length < 2) {
      continue;
    }
    const screenId = parts[0];
    const fileName = parts[parts.length - 1];
    if (!fileName.endsWith(".html")) {
      continue;
    }
    const versions = byScreen.get(screenId) ?? [];
    versions.push({
      version: versionFromFile(fileName),
      relativePath: normalized,
    });
    byScreen.set(screenId, versions);
  }

  return [...byScreen.entries()]
    .map(([id, versions]) => ({
      id,
      name: screenLabelFromId(id),
      versions: versions.sort((a, b) => a.version.localeCompare(b.version)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}