export const DEFAULT_AUTOPILOT_PICKUP_LABELS = ["agent-ready", "fix"] as const;
export const DEFAULT_AUTOPILOT_MAX_PARALLEL = 2;
export const MAX_AUTOPILOT_PARALLEL = 5;

export function workspaceAutopilotEnabledKey(workspaceId: string): string {
  return `workspace:${workspaceId}:autopilot_enabled`;
}

export function workspaceAutopilotMaxParallelKey(workspaceId: string): string {
  return `workspace:${workspaceId}:autopilot_max_parallel`;
}

export function workspaceAutopilotPickupLabelsKey(workspaceId: string): string {
  return `workspace:${workspaceId}:autopilot_pickup_labels`;
}

export function resolveAutopilotEnabled(stored: string | null | undefined): boolean {
  if (!stored?.trim()) {
    return false;
  }
  return stored === "1" || stored.toLowerCase() === "true";
}

export function resolveAutopilotMaxParallel(stored: string | null | undefined): number {
  if (!stored?.trim()) {
    return DEFAULT_AUTOPILOT_MAX_PARALLEL;
  }
  const parsed = Number.parseInt(stored, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_AUTOPILOT_MAX_PARALLEL;
  }
  return Math.min(parsed, MAX_AUTOPILOT_PARALLEL);
}

export function resolveAutopilotPickupLabels(stored: string | null | undefined): string[] {
  if (!stored?.trim()) {
    return [...DEFAULT_AUTOPILOT_PICKUP_LABELS];
  }
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_AUTOPILOT_PICKUP_LABELS];
    }
    const labels = parsed
      .filter((item): item is string => typeof item === "string")
      .map((label) => label.trim())
      .filter(Boolean);
    return labels.length > 0 ? labels : [...DEFAULT_AUTOPILOT_PICKUP_LABELS];
  } catch {
    return [...DEFAULT_AUTOPILOT_PICKUP_LABELS];
  }
}

export function serializeAutopilotPickupLabels(labels: readonly string[]): string {
  const normalized = labels.map((label) => label.trim()).filter(Boolean);
  return JSON.stringify(
    normalized.length > 0 ? normalized : [...DEFAULT_AUTOPILOT_PICKUP_LABELS],
  );
}