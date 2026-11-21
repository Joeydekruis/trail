let sqlitePath: string | null = null;

export function setSqliteDatabasePath(path: string | null): void {
  sqlitePath = path;
}

export function getSqliteDatabasePath(): string | null {
  return sqlitePath;
}