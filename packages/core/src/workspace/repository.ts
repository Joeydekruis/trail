/** `owner/repo` → stable workspace id (slug). */
export function workspaceIdFromRepository(repository: string): string {
  const trimmed = repository.trim().toLowerCase();
  const slash = trimmed.indexOf("/");
  if (slash <= 0 || slash === trimmed.length - 1) {
    throw new Error(`Invalid repository: ${repository}`);
  }
  const owner = trimmed.slice(0, slash).replace(/[^a-z0-9_-]/g, "-");
  const repo = trimmed.slice(slash + 1).replace(/[^a-z0-9_-]/g, "-");
  return `${owner}-${repo}`.replace(/-+/g, "-");
}

export function workspaceNameFromRepository(repository: string): string {
  const trimmed = repository.trim();
  const slash = trimmed.indexOf("/");
  if (slash < 0 || slash === trimmed.length - 1) {
    throw new Error(`Invalid repository: ${repository}`);
  }
  const repo = trimmed.slice(slash + 1);
  return repo.charAt(0).toUpperCase() + repo.slice(1);
}

export function shortLabelFromName(name: string): string {
  const first = name.trim().charAt(0);
  if (!first) {
    return "?";
  }
  return first.toUpperCase();
}