import type { SqliteDatabase, SqliteStatement } from "./types.js";
import { openWorkspaceStore, type WorkspaceStore } from "../workspace/store.js";

/** In-process SQLite stand-in for dev when better-sqlite3 is missing or wrong ABI. */
export class MemorySqlite implements SqliteDatabase {
  private readonly tables = new Map<string, Record<string, unknown>[]>();

  exec(sql: string): void {
    if (sql.includes("CREATE TABLE")) {
      for (const name of [
        "schema_version",
        "workspaces",
        "app_settings",
        "issue_cache",
        "worktrees",
        "preview_pins",
      ]) {
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
        if (sql.includes("UPDATE issue_cache SET board_column = ?, state = ?")) {
          const [boardColumn, state, workspaceId, number] = params;
          const rows = self.tables.get("issue_cache") ?? [];
          const target = rows.find(
            (r) => r.workspace_id === workspaceId && r.number === number,
          );
          if (target) {
            target.board_column = boardColumn;
            target.state = state;
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        if (sql.includes("UPDATE issue_cache SET board_column")) {
          const [boardColumn, workspaceId, number] = params;
          const rows = self.tables.get("issue_cache") ?? [];
          const target = rows.find(
            (r) => r.workspace_id === workspaceId && r.number === number,
          );
          if (target) {
            target.board_column = boardColumn;
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        if (sql.includes("INSERT INTO issue_cache")) {
          const row = params[0] as Record<string, unknown>;
          self.tables.get("issue_cache")?.push({
            workspace_id: row.workspaceId,
            number: row.number,
            title: row.title,
            state: row.state,
            board_column: row.boardColumn,
            priority: row.priority,
            labels_json: row.labelsJson,
            updated_at: row.updatedAt,
            html_url: row.htmlUrl,
            body: row.body ?? null,
          });
        }
        if (sql.includes("DELETE FROM issue_cache WHERE workspace_id")) {
          const rows = self.tables.get("issue_cache") ?? [];
          self.tables.set(
            "issue_cache",
            rows.filter((r) => r.workspace_id !== params[0]),
          );
        }
        if (sql.includes("INSERT INTO workspaces")) {
          const row = params[0] as Record<string, unknown>;
          self.tables.get("workspaces")?.push({
            id: row.id,
            name: row.name,
            short_label: row.shortLabel,
            repository: row.repository,
            integration_branch: row.integrationBranch,
            production_branch: row.productionBranch ?? "main",
            sort_order: row.sortOrder,
            accent: row.accent,
            accent_soft: row.accentSoft,
            accent_line: row.accentLine,
            on_accent: row.onAccent,
          });
        }
        if (sql.includes("INSERT OR REPLACE INTO app_settings")) {
          const rows = self.tables.get("app_settings") ?? [];
          const key = params[0];
          const value = params[1];
          self.tables.set(
            "app_settings",
            [...rows.filter((r) => r.key !== key), { key, value }],
          );
        }
        if (sql.includes("DELETE FROM app_settings WHERE key")) {
          const rows = self.tables.get("app_settings") ?? [];
          self.tables.set(
            "app_settings",
            rows.filter((r) => r.key !== params[0]),
          );
        }
        if (sql.includes("INSERT INTO schema_version")) {
          self.tables.set("schema_version", [{ version: params[0] }]);
        }
        if (sql.includes("DELETE FROM schema_version")) {
          self.tables.set("schema_version", []);
        }
        if (sql.includes("DELETE FROM workspaces WHERE repository IS NULL")) {
          const rows = self.tables.get("workspaces") ?? [];
          self.tables.set(
            "workspaces",
            rows.filter((r) => r.repository != null),
          );
        }
        if (sql.includes("INSERT INTO worktrees")) {
          const row = params[0] as Record<string, unknown>;
          const rows = self.tables.get("worktrees") ?? [];
          const mapped = {
            id: row.id,
            workspace_id: row.workspaceId,
            issue_number: row.issueNumber,
            title: row.title,
            branch: row.branch,
            path: row.path,
            status: row.status,
            is_remote: row.isRemote,
            created_at: row.createdAt,
          };
          const next = rows.filter((r) => r.id !== mapped.id);
          next.push(mapped);
          self.tables.set("worktrees", next);
        }
        if (sql.includes("INSERT INTO preview_pins")) {
          const row = params[0] as Record<string, unknown>;
          const rows = self.tables.get("preview_pins") ?? [];
          const id = rows.length + 1;
          rows.push({
            id,
            workspace_id: row.workspaceId,
            issue_number: row.issueNumber,
            pin_number: row.pinNumber,
            comment: row.comment,
            page_url: row.pageUrl,
            selector: row.selector,
            xpath: row.xpath,
            element_text: row.elementText,
            offset_x: row.offsetX,
            offset_y: row.offsetY,
            viewport_width: row.viewportWidth,
            viewport_height: row.viewportHeight,
            created_at: row.createdAt,
          });
          self.tables.set("preview_pins", rows);
          return { changes: 1, lastInsertRowid: id };
        }
        return { changes: 1 };
      },
      get(...params: unknown[]) {
        if (sql.includes("schema_version")) {
          return (self.tables.get("schema_version") ?? [])[0];
        }
        if (sql.includes("COUNT(*)") && sql.includes("issue_cache") && sql.includes("state = 'open'")) {
          const open =
            self.tables
              .get("issue_cache")
              ?.filter((r) => r.workspace_id === params[0] && r.state === "open").length ?? 0;
          return { count: open };
        }
        if (sql.includes("COUNT(*)") && sql.includes("repository IS NOT NULL")) {
          const linked =
            self.tables.get("workspaces")?.filter((r) => r.repository != null).length ?? 0;
          return { count: linked };
        }
        if (sql.includes("COUNT(*)")) {
          return { count: self.tables.get("workspaces")?.length ?? 0 };
        }
        if (sql.includes("MAX(sort_order)")) {
          const rows = self.tables.get("workspaces") ?? [];
          const maxOrder = rows.reduce(
            (max, r) => Math.max(max, (r.sort_order as number) ?? 0),
            -1,
          );
          return { maxOrder: rows.length === 0 ? null : maxOrder };
        }
        if (sql.includes("app_settings") && sql.includes("key")) {
          return (
            self.tables.get("app_settings")?.find((r) => r.key === params[0]) ??
            undefined
          );
        }
        if (sql.includes("issue_cache WHERE workspace_id") && sql.includes("AND number")) {
          return self.tables
            .get("issue_cache")
            ?.find((r) => r.workspace_id === params[0] && r.number === params[1]);
        }
        if (sql.includes("FROM worktrees WHERE workspace_id") && sql.includes("AND issue_number")) {
          return self.tables
            .get("worktrees")
            ?.find(
              (r) => r.workspace_id === params[0] && r.issue_number === params[1],
            );
        }
        if (sql.includes("MAX(pin_number)") && sql.includes("preview_pins")) {
          const rows =
            self.tables.get("preview_pins")?.filter(
              (r) => r.workspace_id === params[0] && r.issue_number === params[1],
            ) ?? [];
          const maxNum = rows.reduce(
            (max, r) => Math.max(max, (r.pin_number as number) ?? 0),
            0,
          );
          return { maxNum: rows.length === 0 ? null : maxNum };
        }
        if (sql.includes("workspaces WHERE id")) {
          return self.tables.get("workspaces")?.find((r) => r.id === params[0]);
        }
        if (sql.includes("SELECT 1 FROM workspaces")) {
          return self.tables.get("workspaces")?.some((r) => r.id === params[0])
            ? { 1: 1 }
            : undefined;
        }
        return undefined;
      },
      all(...params: unknown[]) {
        if (sql.includes("FROM issue_cache WHERE workspace_id")) {
          return [...(self.tables.get("issue_cache") ?? [])]
            .filter((r) => r.workspace_id === params[0])
            .sort((a, b) => (a.number as number) - (b.number as number));
        }
        if (sql.includes("FROM worktrees WHERE workspace_id")) {
          return [...(self.tables.get("worktrees") ?? [])]
            .filter((r) => r.workspace_id === params[0])
            .sort((a, b) => (b.issue_number as number) - (a.issue_number as number));
        }
        if (sql.includes("FROM preview_pins WHERE workspace_id")) {
          return [...(self.tables.get("preview_pins") ?? [])]
            .filter(
              (r) => r.workspace_id === params[0] && r.issue_number === params[1],
            )
            .sort((a, b) => (a.pin_number as number) - (b.pin_number as number));
        }
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

export function openInMemoryWorkspaceStore(): WorkspaceStore {
  return openWorkspaceStore(new MemorySqlite());
}