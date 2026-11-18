import { useCallback, useEffect, useState } from "react";
import type { WorkspaceDto } from "@trail/ipc";
import { OnboardingView } from "./OnboardingView";
import { TrailShell } from "./TrailShell";
import { isElectronRenderer, waitForTrail } from "./wait-for-trail";
import { applyWorkspaceAccent } from "./workspace-accent";

declare global {
  interface Window {
    trail?: {
      platform: string;
      listWorkspaces: () => Promise<{
        workspaces: WorkspaceDto[];
        activeWorkspaceId: string;
      }>;
      switchWorkspace: (workspaceId: string) => Promise<{
        active: WorkspaceDto;
        workspaces: WorkspaceDto[];
      }>;
      syncNow: (workspaceId?: string) => Promise<void>;
      minimize?: () => Promise<void>;
      maximize?: () => Promise<void>;
      close?: () => Promise<void>;
    };
  }
}

type AppView = "dashboard" | "onboarding";

export function App() {
  const platform = window.trail?.platform ?? "unknown";
  const [view, setView] = useState<AppView>("dashboard");
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const applyActive = useCallback((active: WorkspaceDto) => {
    setActiveWorkspaceId(active.id);
    applyWorkspaceAccent(active);
  }, []);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      const api = window.trail;
      if (!api) {
        return;
      }
      const result = await api.switchWorkspace(workspaceId);
      setWorkspaces(result.workspaces);
      applyActive(result.active);
    },
    [applyActive],
  );

  useEffect(() => {
    let cancelled = false;
    void waitForTrail().then((api) => {
      if (cancelled) {
        return;
      }
      if (!api) {
        if (!isElectronRenderer()) {
          setLoadError(
            "You are in a browser tab. Close it and use the Trail window opened by npm run desktop:dev (Electron).",
          );
        } else {
          setLoadError(
            "Preload bridge unavailable in Electron. Check the terminal for “[trail] Preload failed”. Then run: npm run desktop:dev from the repo root.",
          );
        }
        return;
      }
      void api
        .listWorkspaces()
        .then((data) => {
          if (cancelled) {
            return;
          }
          setWorkspaces(data.workspaces);
          const active =
            data.workspaces.find((w) => w.id === data.activeWorkspaceId) ??
            data.workspaces[0];
          if (active) {
            applyActive(active);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setLoadError(err instanceof Error ? err.message : "Failed to load workspaces");
          }
        });
    });
    return () => {
      cancelled = true;
    };
  }, [applyActive]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      const index = Number.parseInt(event.key, 10);
      if (index < 1 || index > 9) {
        return;
      }
      const target = workspaces[index - 1];
      if (!target || target.id === activeWorkspaceId) {
        return;
      }
      event.preventDefault();
      void switchWorkspace(target.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [workspaces, activeWorkspaceId, switchWorkspace]);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const onSyncNow = useCallback(() => {
    const api = window.trail;
    if (!api || syncing) {
      return;
    }
    setSyncing(true);
    void api
      .syncNow(activeWorkspace?.id)
      .catch(() => undefined)
      .finally(() => setSyncing(false));
  }, [activeWorkspace?.id, syncing]);

  if (view === "onboarding") {
    return (
      <div className="trail-app trail-app--solo">
        <OnboardingView onComplete={() => setView("dashboard")} onBack={() => setView("dashboard")} />
      </div>
    );
  }

  if (loadError && workspaces.length === 0) {
    return (
      <div className="trail-app trail-app--solo">
        <p className="tr-conflict-text">{loadError}</p>
      </div>
    );
  }

  return (
    <TrailShell
      workspaces={workspaces}
      activeWorkspace={activeWorkspace}
      activeWorkspaceId={activeWorkspaceId}
      platform={platform}
      onSwitchWorkspace={(id) => void switchWorkspace(id)}
      onSyncNow={onSyncNow}
      syncing={syncing}
      onShowOnboarding={() => setView("onboarding")}
    />
  );
}