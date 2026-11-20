import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkspaceDto, WorkspaceGithubSnapshot } from "@trail/ipc";
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
        needsOnboarding: boolean;
        github: WorkspaceGithubSnapshot;
        activeLastSyncedAt: string | null;
      }>;
      switchWorkspace: (workspaceId: string) => Promise<{
        active: WorkspaceDto;
        workspaces: WorkspaceDto[];
      }>;
      createWorkspace?: (input: {
        repository: string;
        name?: string;
        integrationBranch?: string;
        productionBranch?: string;
      }) => Promise<{
        active: WorkspaceDto;
        workspaces: WorkspaceDto[];
      }>;
      githubStatus?: () => Promise<{ connected: boolean; login?: string }>;
      githubSetToken?: (
        token: string,
      ) => Promise<{ ok: true; login: string } | { ok: false; message: string }>;
      githubListBranches?: (repository: string) => Promise<{ branches: string[] }>;
      githubListRepos?: () => Promise<{
        repos: Array<{
          fullName: string;
          description: string | null;
          openIssuesCount: number;
        }>;
      }>;
      githubClearToken?: () => Promise<{ cleared: true }>;
      getBoardSnapshot?: (workspaceId?: string) => Promise<import("@trail/ipc").BoardSnapshotResult>;
      getIssueDetail?: (input: {
        workspaceId?: string;
        issueNumber: number;
      }) => Promise<import("@trail/ipc").IssueGetResult>;
      openExternal?: (url: string) => Promise<void>;
      syncNow: (
        workspaceId?: string,
      ) => Promise<
        | { ok: true; syncedAt: string; issueCount: number }
        | { ok: false; message: string }
      >;
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
  const [syncError, setSyncError] = useState<string | null>(null);
  const [github, setGithub] = useState<WorkspaceGithubSnapshot>({ connected: false });
  const [activeLastSyncedAt, setActiveLastSyncedAt] = useState<string | null>(null);
  const initialOnboardingGate = useRef(true);

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
      const snapshot = await api.listWorkspaces();
      setGithub(snapshot.github);
      setActiveLastSyncedAt(snapshot.activeLastSyncedAt);
    },
    [applyActive],
  );

  const applyWorkspaceSnapshot = useCallback(
    (data: {
      workspaces: WorkspaceDto[];
      activeWorkspaceId: string;
      needsOnboarding: boolean;
      github: WorkspaceGithubSnapshot;
      activeLastSyncedAt: string | null;
    }) => {
      setWorkspaces(data.workspaces);
      setGithub(data.github);
      setActiveLastSyncedAt(data.activeLastSyncedAt);
      const active =
        data.workspaces.find((w) => w.id === data.activeWorkspaceId) ?? data.workspaces[0];
      if (active) {
        applyActive(active);
      }
      if (initialOnboardingGate.current && data.needsOnboarding) {
        setView("onboarding");
        initialOnboardingGate.current = false;
      }
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
          applyWorkspaceSnapshot(data);
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
  }, [applyWorkspaceSnapshot]);

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

  const refreshWorkspaces = useCallback(async () => {
    const api = window.trail;
    if (!api) {
      return;
    }
    const data = await api.listWorkspaces();
    applyWorkspaceSnapshot(data);
  }, [applyWorkspaceSnapshot]);

  const onGithubDisconnect = useCallback(async () => {
    const api = window.trail;
    if (!api?.githubClearToken) {
      return;
    }
    await api.githubClearToken();
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  const onSyncNow = useCallback(() => {
    const api = window.trail;
    if (!api || syncing) {
      return;
    }
    setSyncing(true);
    setSyncError(null);
    void api
      .syncNow(activeWorkspace?.id)
      .then((result) => {
        if (result.ok) {
          setActiveLastSyncedAt(result.syncedAt);
          return;
        }
        setSyncError(result.message);
      })
      .catch((error: unknown) => {
        setSyncError(error instanceof Error ? error.message : "Sync failed");
      })
      .finally(() => setSyncing(false));
  }, [activeWorkspace?.id, syncing]);

  if (view === "onboarding") {
    return (
      <div className="trail-app trail-app--solo">
        <OnboardingView
          onComplete={async () => {
            await refreshWorkspaces();
            setView("dashboard");
          }}
          onBack={() => setView("dashboard")}
        />
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
      syncError={syncError}
      lastSyncedAt={activeLastSyncedAt}
      github={github}
      onGithubDisconnect={() => void onGithubDisconnect()}
      onShowOnboarding={() => setView("onboarding")}
      onGithubRefresh={() => void refreshWorkspaces()}
    />
  );
}