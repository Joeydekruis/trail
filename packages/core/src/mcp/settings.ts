import type { WorkspaceStore } from "../workspace/store.js";

export const MCP_WRITE_TOOLS = [
  "create_decision",
  "update_task_status",
  "resolve_pin",
  "add_task_comment",
  "start_agent_run",
  "stop_agent_run",
] as const;

export type McpWriteToolName = (typeof MCP_WRITE_TOOLS)[number];

export type McpWorkspaceSettings = {
  workspaceId: string;
  enabled: boolean;
  readEnabled: boolean;
  writeEnabled: boolean;
  sourceDocs: boolean;
  sourceDecisions: boolean;
  sourceDesigns: boolean;
  allowAgentRuns: boolean;
};

const PARTS = {
  enabled: "enabled",
  read: "read",
  write: "write",
  sourceDocs: "source_docs",
  sourceDecisions: "source_decisions",
  sourceDesigns: "source_designs",
  allowAgentRuns: "allow_agent_runs",
} as const;

export function workspaceMcpSettingsKey(workspaceId: string, part: string): string {
  return `mcp.${workspaceId}.${part}`;
}

export function resolveMcpFlag(value: string | null, defaultOn: boolean): boolean {
  if (value == null || value.trim() === "") {
    return defaultOn;
  }
  return value === "1" || value.toLowerCase() === "true";
}

export function readMcpWorkspaceSettings(
  store: WorkspaceStore,
  workspaceId: string,
): McpWorkspaceSettings {
  const flag = (part: string, defaultOn: boolean) =>
    resolveMcpFlag(store.getAppSetting(workspaceMcpSettingsKey(workspaceId, part)), defaultOn);
  return {
    workspaceId,
    enabled: flag(PARTS.enabled, true),
    readEnabled: flag(PARTS.read, true),
    writeEnabled: flag(PARTS.write, true),
    sourceDocs: flag(PARTS.sourceDocs, true),
    sourceDecisions: flag(PARTS.sourceDecisions, true),
    sourceDesigns: flag(PARTS.sourceDesigns, true),
    allowAgentRuns: flag(PARTS.allowAgentRuns, false),
  };
}

export function writeMcpWorkspaceSettings(
  store: WorkspaceStore,
  workspaceId: string,
  patch: Partial<Omit<McpWorkspaceSettings, "workspaceId">>,
): McpWorkspaceSettings {
  const current = readMcpWorkspaceSettings(store, workspaceId);
  const next: McpWorkspaceSettings = {
    workspaceId,
    enabled: patch.enabled ?? current.enabled,
    readEnabled: patch.readEnabled ?? current.readEnabled,
    writeEnabled: patch.writeEnabled ?? current.writeEnabled,
    sourceDocs: patch.sourceDocs ?? current.sourceDocs,
    sourceDecisions: patch.sourceDecisions ?? current.sourceDecisions,
    sourceDesigns: patch.sourceDesigns ?? current.sourceDesigns,
    allowAgentRuns: patch.allowAgentRuns ?? current.allowAgentRuns,
  };
  const save = (part: string, value: boolean) => {
    store.setAppSetting(workspaceMcpSettingsKey(workspaceId, part), value ? "1" : "0");
  };
  save(PARTS.enabled, next.enabled);
  save(PARTS.read, next.readEnabled);
  save(PARTS.write, next.writeEnabled);
  save(PARTS.sourceDocs, next.sourceDocs);
  save(PARTS.sourceDecisions, next.sourceDecisions);
  save(PARTS.sourceDesigns, next.sourceDesigns);
  save(PARTS.allowAgentRuns, next.allowAgentRuns);
  return readMcpWorkspaceSettings(store, workspaceId);
}

export function isMcpWriteTool(tool: string): tool is McpWriteToolName {
  return (MCP_WRITE_TOOLS as readonly string[]).includes(tool);
}

export type McpToolGateResult =
  | { ok: true; workspaceId: string }
  | { ok: false; code: "disabled"; message: string };

export function assertMcpToolAllowed(
  store: WorkspaceStore,
  tool: string,
  workspaceId?: string,
): McpToolGateResult {
  if (tool === "list_workspaces") {
    return { ok: true, workspaceId: workspaceId ?? store.getActiveId() };
  }
  const ws = workspaceId?.trim() || store.getActiveId();
  const settings = readMcpWorkspaceSettings(store, ws);
  if (!settings.enabled) {
    return {
      ok: false,
      code: "disabled",
      message: `MCP is disabled for workspace ${ws}`,
    };
  }
  if (isMcpWriteTool(tool)) {
    if (!settings.writeEnabled) {
      return {
        ok: false,
        code: "disabled",
        message: `MCP write tools are disabled for workspace ${ws}`,
      };
    }
  } else if (!settings.readEnabled) {
    return {
      ok: false,
      code: "disabled",
      message: `MCP read tools are disabled for workspace ${ws}`,
    };
  }
  if (tool === "search_docs" && !settings.sourceDocs) {
    return {
      ok: false,
      code: "disabled",
      message: `MCP knowledge/docs access is disabled for workspace ${ws}`,
    };
  }
  if (
    (tool === "list_decisions" || tool === "get_decision" || tool === "create_decision") &&
    !settings.sourceDecisions
  ) {
    return {
      ok: false,
      code: "disabled",
      message: `MCP decisions access is disabled for workspace ${ws}`,
    };
  }
  if (
    (tool === "start_agent_run" || tool === "stop_agent_run") &&
    !settings.allowAgentRuns
  ) {
    return {
      ok: false,
      code: "disabled",
      message: `MCP agent runs are disabled for workspace ${ws}`,
    };
  }
  return { ok: true, workspaceId: ws };
}