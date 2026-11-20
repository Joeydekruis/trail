import { useCallback, useEffect, useRef, useState } from "react";
import type { WorktreeDto, WorkspaceDto, WorkspaceGithubSnapshot } from "@trail/ipc";
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
      githubListBranches?: (repository: string) => Promise<{ branches: string[]; error?: string }>;
      githubListRepos?: () => Promise<{
        repos: Array<{
          fullName: string;
          description: string | null;
          openIssuesCount: number;
        }>;
      }>;
      githubClearToken?: () => Promise<{ cleared: true }>;
      getGithubBoardMapping?: (workspaceId?: string) => Promise<{
        projectStatusField: string;
        syncIntervalSec: number;
      }>;
      setGithubBoardMapping?: (input: {
        workspaceId?: string;
        projectStatusField?: string;
        syncIntervalSec?: number;
      }) => Promise<{ projectStatusField: string; syncIntervalSec: number }>;
      onBackgroundSync?: (
        listener: (payload: { workspaceId: string; syncedAt: string; issueCount: number }) => void,
      ) => () => void;
      getBoardSnapshot?: (workspaceId?: string) => Promise<import("@trail/ipc").BoardSnapshotResult>;
      moveBoardIssue?: (input: {
        workspaceId?: string;
        issueNumber: number;
        targetColumn: import("@trail/ipc").BoardColumnIdDto;
      }) => Promise<import("@trail/ipc").BoardMoveIssueResult>;
      createIssue?: (input: {
        workspaceId?: string;
        title: string;
        body: string;
        type: "feature" | "bug" | "chore" | "docs";
        priority: "urgent" | "high" | "medium" | "low";
        agentReady?: boolean;
      }) => Promise<
        | { ok: true; issueNumber: number; htmlUrl: string }
        | { ok: false; message: string }
      >;
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
      listWorktrees?: (workspaceId?: string) => Promise<{
        worktrees: WorktreeDto[];
        repoRoot: string | null;
        worktreeRoot: string | null;
      }>;
      createWorktree?: (input: {
        workspaceId?: string;
        issueNumber: number;
        title?: string;
      }) => Promise<
        | { ok: true; worktree: WorktreeDto }
        | { ok: false; message: string }
      >;
      getRepoRoot?: (workspaceId?: string) => Promise<{
        repoRoot: string | null;
        worktreeRoot: string | null;
      }>;
      setRepoRoot?: (input: {
        workspaceId?: string;
        repoRoot: string | null;
        worktreeRoot?: string;
      }) => Promise<{
        repoRoot: string | null;
        worktreeRoot: string;
        message?: string;
      }>;
      pickRepoRoot?: () => Promise<
        | { ok: true; path: string }
        | { ok: false; cancelled: true }
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
  const [boardRefreshKey, setBoardRefreshKey] = useState(0);
  const [github, setGithub] = useState<WorkspaceGithubSnapshot>({ connected: false });
  const [activeLastSyncedAt, setActiveLastSyncedAt] = useState<string | null>(null);
  const [worktrees, setWorktrees] = useState<WorktreeDto[]>([]);
  const [worktreesLive, setWorktreesLive] = useState(false);
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

  const refreshWorktrees = useCallback(async () => {
    const api = window.trail;
    if (!api?.listWorktrees) {
      setWorktreesLive(false);
      return;
    }
    setWorktreesLive(true);
    try {
      const data = await api.listWorktrees(activeWorkspace?.id);
      setWorktrees(data.worktrees);
    } catch {
      setWorktrees([]);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void refreshWorktrees();
  }, [refreshWorktrees]);

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

  useEffect(() => {
    const api = window.trail;
    if (!api?.onBackgroundSync) {
      return;
    }
    return api.onBackgroundSync((payload) => {
      if (payload.workspaceId === activeWorkspaceId) {
        setActiveLastSyncedAt(payload.syncedAt);
      }
      void refreshWorkspaces();
      setBoardRefreshKey((key) => key + 1);
    });
  }, [activeWorkspaceId, refreshWorkspaces]);

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
          setBoardRefreshKey((key) => key + 1);
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
      boardRefreshKey={boardRefreshKey}
      onIssueCreated={() => {
        onSyncNow();
        void refreshWorktrees();
      }}
      onGithubRefresh={() => void refreshWorkspaces()}
      worktrees={worktrees}
      worktreesLive={worktreesLive}
      onRefreshWorktrees={() => void refreshWorktrees()}
    />
  );
}