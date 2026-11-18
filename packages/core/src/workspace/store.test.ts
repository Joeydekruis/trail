import { describe, expect, it } from "vitest";
import type { SqliteDatabase, SqliteStatement } from "../db/types.js";
import { openWorkspaceStore } from "./store.js";

class MemorySqlite implements SqliteDatabase {
  private readonly tables = new Map<string, Record<string, unknown>[]>();

  exec(sql: string): void {
    if (sql.includes("CREATE TABLE")) {
      for (const name of ["schema_version", "workspaces", "app_settings"]) {
        if (sql.includes(name) && !this.tables.has(name)) {
          this.tables.set(name, []);
        }
      }
    }
  }

  prepare(sql: string): SqliteStatement {
    const self = this;
    return {
      run(...params: unknown[]) {
        if (sql.includes("INSERT INTO workspaces")) {
          const row = params[0] as Record<string, unknown>;
          self.tables.get("workspaces")?.push({
            id: row.id,
            name: row.name,
            short_label: row.shortLabel,
            repository: row.repository,
            integration_branch: row.integrationBranch,
            sort_order: row.sortOrder,
            accent: row.accent,
            accent_soft: row.accentSoft,
            accent_line: row.accentLine,
            on_accent: row.onAccent,
          });
        }
        if (sql.includes("INSERT OR REPLACE INTO app_settings")) {
          self.tables.set("app_settings", [
            { key: params[0], value: params[1] },
          ]);
        }
        if (sql.includes("INSERT INTO schema_version")) {
          self.tables.set("schema_version", [{ version: params[0] }]);
        }
        if (sql.includes("DELETE FROM schema_version")) {
          self.tables.set("schema_version", []);
        }
        return { changes: 1 };
      },
      get(...params: unknown[]) {
        if (sql.includes("schema_version")) {
          const rows = self.tables.get("schema_version") ?? [];
          return rows[0];
        }
        if (sql.includes("COUNT(*)")) {
          return { count: self.tables.get("workspaces")?.length ?? 0 };
        }
        if (sql.includes("app_settings") && sql.includes("key")) {
          return (
            self.tables.get("app_settings")?.find((r) => r.key === params[0]) ??
            undefined
          );
        }
        if (sql.includes("workspaces WHERE id")) {
          return self.tables
            .get("workspaces")
            ?.find((r) => r.id === params[0]);
        }
        if (sql.includes("SELECT 1 FROM workspaces")) {
          return self.tables
            .get("workspaces")
            ?.some((r) => r.id === params[0])
            ? { 1: 1 }
            : undefined;
        }
        return undefined;
      },
      all() {
        if (sql.includes("FROM workspaces ORDER BY")) {
          const rows = [...(self.tables.get("workspaces") ?? [])];
          rows.sort(
            (a, b) =>
              (a.sort_order as number) - (b.sort_order as number) ||
              String(a.name).localeCompare(String(b.name)),
          );
          return rows;
        }
        return [];
      },
    };
  }

  transaction(fn: () => void): () => void {
    return () => fn();
  }
}

describe("WorkspaceStore", () => {
  it("seeds demo workspaces on empty database", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    const workspaces = store.list();
    expect(workspaces.length).toBe(3);
    expect(workspaces.map((w) => w.id)).toEqual(["trail", "loupe", "dockyrd"]);
  });

  it("switches active workspace", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(store.getActiveId()).toBe("trail");
    const next = store.switchTo("loupe");
    expect(next.id).toBe("loupe");
    expect(store.getActiveId()).toBe("loupe");
  });

  it("rejects unknown workspace id", () => {
    const store = openWorkspaceStore(new MemorySqlite());
    expect(() => store.switchTo("missing")).toThrow(/Unknown workspace/);
  });
});