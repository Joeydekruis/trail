import { homedir } from "node:os";
import { join } from "node:path";

/** Default Electron userData folder for @trail/desktop (matches dev + packaged layout). */
export function defaultTrailDesktopUserDataDir(): string {
  const home = homedir();
  switch (process.platform) {
    case "darwin":
      return join(home, "Library", "Application Support", "@trail", "desktop");
    case "win32":
      return join(process.env.APPDATA ?? join(home, "AppData", "Roaming"), "@trail", "desktop");
    default:
      return join(home, ".config", "@trail", "desktop");
  }
}

export const MCP_CONNECTION_FILENAME = "mcp-connection.json" as const;

export function resolveMcpConnectionFile(): string {
  const fromEnv = process.env.TRAIL_MCP_CONNECTION?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  return join(defaultTrailDesktopUserDataDir(), MCP_CONNECTION_FILENAME);
}

export type McpConnectionFile = {
  baseUrl: string;
  token: string;
  updatedAt: string;
};