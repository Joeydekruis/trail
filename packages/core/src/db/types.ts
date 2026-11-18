export type SqliteStatement = {
  run: (...params: unknown[]) => { changes: number };
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
};

export type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  transaction: (fn: () => void) => () => void;
};