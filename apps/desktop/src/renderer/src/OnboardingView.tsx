import { useEffect, useState, type ReactNode } from "react";
import { TrailLogo } from "./design/TrailIcons";
import { TrailButton, TrailChip, TrailSelect, trailFieldStyle } from "./design/TrailUi";

const FALLBACK_BRANCHES = ["development", "develop", "staging", "main", "master"] as const;

function pickIntegrationBranch(branches: string[]): string {
  const prefer = ["development", "develop", "staging"];
  for (const name of prefer) {
    if (branches.includes(name)) {
      return name;
    }
  }
  return branches[0] ?? "development";
}

function pickProductionBranch(branches: string[], integration: string): string {
  const prefer = ["main", "master", "production"];
  for (const name of prefer) {
    if (branches.includes(name) && name !== integration) {
      return name;
    }
  }
  return branches.find((name) => name !== integration) ?? branches[0] ?? "main";
}

const STEPS = ["Connect GitHub", "Choose a repository", "Set up the repository"] as const;

type RepoOption = {
  fullName: string;
  description: string | null;
  openIssuesCount: number;
};

const DEMO_REPOS: RepoOption[] = [
  { fullName: "joeydekruijs/trail", description: "Trail desktop", openIssuesCount: 12 },
  { fullName: "joeydekruijs/loupe", description: "Loupe", openIssuesCount: 4 },
  { fullName: "joeydekruijs/dockyrd", description: "Dockyrd", openIssuesCount: 2 },
];

type OnboardingViewProps = {
  onComplete: () => void | Promise<void>;
  onBack?: () => void;
};

export function OnboardingView({ onComplete, onBack }: OnboardingViewProps) {
  const [step, setStep] = useState(0);
  const [selectedRepo, setSelectedRepo] = useState(0);
  const [importDocs, setImportDocs] = useState(true);
  const [createLabels, setCreateLabels] = useState(true);
  const [createFolders, setCreateFolders] = useState(true);
  const [useProject, setUseProject] = useState(true);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [patOpen, setPatOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [patBusy, setPatBusy] = useState(false);
  const [patError, setPatError] = useState<string | null>(null);
  const [repos, setRepos] = useState<RepoOption[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [integrationBranch, setIntegrationBranch] = useState("development");
  const [productionBranch, setProductionBranch] = useState("main");
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [finishBusy, setFinishBusy] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [localRepoRoot, setLocalRepoRoot] = useState("");
  const [repoRootError, setRepoRootError] = useState<string | null>(null);

  useEffect(() => {
    const api = window.trail;
    if (!api?.githubStatus) {
      return;
    }
    void api.githubStatus().then((status) => {
      if (status.connected && status.login) {
        setGithubLogin(status.login);
      }
    });
  }, []);

  useEffect(() => {
    const api = window.trail;
    if (step !== 1) {
      return;
    }
    if (!githubLogin) {
      setRepos(DEMO_REPOS);
      setReposLoaded(true);
      setReposLoading(false);
      const demoBranches = [...FALLBACK_BRANCHES];
      setBranchOptions(demoBranches);
      setBranchesError(null);
      const integration = pickIntegrationBranch(demoBranches);
      setIntegrationBranch(integration);
      setProductionBranch(pickProductionBranch(demoBranches, integration));
      return;
    }
    if (!api?.githubListRepos) {
      setRepos(DEMO_REPOS);
      setReposLoaded(true);
      setBranchOptions([...FALLBACK_BRANCHES]);
      return;
    }

    let cancelled = false;
    setReposLoading(true);
    setReposLoaded(false);
    setRepos([]);
    setSelectedRepo(0);
    setBranchOptions([]);
    setBranchesError(null);

    void api
      .githubListRepos()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.repos.length > 0) {
          setRepos(result.repos);
          setSelectedRepo(0);
        } else {
          setRepos([]);
        }
        setReposLoaded(true);
      })
      .finally(() => {
        if (!cancelled) {
          setReposLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [step, githubLogin]);

  useEffect(() => {
    const api = window.trail;
    const repo = repos[selectedRepo];
    if (step !== 1 || !githubLogin || !reposLoaded || reposLoading || !repo) {
      return;
    }
    if (!api?.githubListBranches) {
      setBranchOptions([...FALLBACK_BRANCHES]);
      return;
    }

    let cancelled = false;
    setBranchesLoading(true);
    setBranchesError(null);

    void api
      .githubListBranches(repo.fullName)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.branches.length === 0) {
          setBranchOptions([]);
          setBranchesError(result.error ?? "No branches found for this repository.");
          return;
        }
        setBranchOptions(result.branches);
        const integration = pickIntegrationBranch(result.branches);
        setIntegrationBranch(integration);
        setProductionBranch(pickProductionBranch(result.branches, integration));
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setBranchOptions([]);
        setBranchesError(error instanceof Error ? error.message : "Could not load branches");
      })
      .finally(() => {
        if (!cancelled) {
          setBranchesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [step, githubLogin, selectedRepo, repos, reposLoaded, reposLoading]);

  const githubReady = Boolean(githubLogin);

  async function connectWithPat() {
    const api = window.trail;
    if (!api?.githubSetToken || patBusy) {
      return;
    }
    setPatBusy(true);
    setPatError(null);
    try {
      const result = await api.githubSetToken(pat);
      if (!result.ok) {
        setPatError(result.message);
        return;
      }
      setGithubLogin(result.login);
      setPatOpen(false);
      setPat("");
    } finally {
      setPatBusy(false);
    }
  }

  async function pickLocalRepoRoot() {
    const api = window.trail;
    if (!api?.pickRepoRoot) {
      return;
    }
    setRepoRootError(null);
    const picked = await api.pickRepoRoot();
    if (!picked.ok) {
      if ("cancelled" in picked && picked.cancelled) {
        return;
      }
      if ("message" in picked) {
        setRepoRootError(picked.message);
      }
      return;
    }
    setLocalRepoRoot(picked.path);
  }

  async function openWorkspace() {
    const api = window.trail;
    const repo = repos[selectedRepo];
    if (!api?.createWorkspace || !repo) {
      await onComplete();
      return;
    }
    setFinishBusy(true);
    setFinishError(null);
    try {
      await api.createWorkspace({
        repository: repo.fullName,
        integrationBranch,
        productionBranch,
      });
      if (localRepoRoot.trim() && api.setRepoRoot) {
        const saved = await api.setRepoRoot({ repoRoot: localRepoRoot.trim() });
        if (saved.message) {
          setRepoRootError(saved.message);
        }
      }
      await onComplete();
    } catch (error) {
      setFinishError(error instanceof Error ? error.message : "Could not create workspace");
    } finally {
      setFinishBusy(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <TrailLogo />
        <span style={{ fontSize: 15, fontWeight: 600 }}>Trail</span>
        <span className="tr-small" style={{ marginLeft: "auto" }}>
          Set up your first workspace
        </span>
      </div>

      <StepRail active={step} />

      {step === 0 ? (
        <StepConnectGitHub
          login={githubLogin}
          patOpen={patOpen}
          pat={pat}
          patError={patError}
          patBusy={patBusy}
          onPatOpen={() => setPatOpen(true)}
          onPatChange={setPat}
          onPatConnect={() => void connectWithPat()}
        />
      ) : null}
      {step === 1 ? (
        <StepChooseRepo
          repos={repos}
          loading={reposLoading}
          selected={selectedRepo}
          onSelect={setSelectedRepo}
          integrationBranch={integrationBranch}
          onIntegrationBranchChange={setIntegrationBranch}
          productionBranch={productionBranch}
          onProductionBranchChange={setProductionBranch}
          branchOptions={branchOptions}
          branchesLoading={branchesLoading}
          branchesError={branchesError}
        />
      ) : null}
      {step === 2 ? (
        <StepSetupRepo
          importDocs={importDocs}
          createLabels={createLabels}
          createFolders={createFolders}
          useProject={useProject}
          onImportDocs={() => setImportDocs((v) => !v)}
          onCreateLabels={() => setCreateLabels((v) => !v)}
          onCreateFolders={() => setCreateFolders((v) => !v)}
          onUseProject={() => setUseProject((v) => !v)}
          localRepoRoot={localRepoRoot}
          repoRootError={repoRootError}
          onLocalRepoRootChange={setLocalRepoRoot}
          onPickRepoRoot={() => void pickLocalRepoRoot()}
        />
      ) : null}

      <p className="tr-small" style={{ margin: 0 }}>
        {step === 0
          ? "Trail never changes anything outside the repository you choose. You can disconnect at any time in Settings."
          : step === 2
            ? "Everything Trail creates is a normal commit, so you can review or revert it."
            : null}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
        {step > 0 ? (
          <TrailButton variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </TrailButton>
        ) : onBack ? (
          <TrailButton variant="ghost" onClick={onBack}>
            Back
          </TrailButton>
        ) : null}
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          {finishError ? (
            <span className="tr-small" style={{ color: "var(--warning)" }}>
              {finishError}
            </span>
          ) : null}
          {step < 2 ? (
            <TrailButton
              variant="primary"
              disabled={
                (step === 0 && !githubReady) ||
                (step === 1 &&
                  (repos.length === 0 || branchesLoading || branchOptions.length === 0))
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </TrailButton>
          ) : (
            <TrailButton variant="primary" disabled={finishBusy} onClick={() => void openWorkspace()}>
              {finishBusy ? "Creating…" : "Open workspace"}
            </TrailButton>
          )}
        </span>
      </div>
    </div>
  );
}

function StepRail({ active }: { active: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {STEPS.map((label, i) => {
        const on = i <= active;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <span
              style={{
                flex: "0 0 auto",
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                background: on ? "var(--accent-soft)" : "var(--surface-raised)",
                color: on ? "var(--accent)" : "var(--ink-muted)",
                border: `1px solid ${on ? "var(--accent-line)" : "var(--line-strong)"}`,
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: 12, color: on ? "var(--ink)" : "var(--ink-muted)" }}>{label}</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          </div>
        );
      })}
    </div>
  );
}

function StepConnectGitHub({
  login,
  patOpen,
  pat,
  patError,
  patBusy,
  onPatOpen,
  onPatChange,
  onPatConnect,
}: {
  login: string | null;
  patOpen: boolean;
  pat: string;
  patError: string | null;
  patBusy: boolean;
  onPatOpen: () => void;
  onPatChange: (value: string) => void;
  onPatConnect: () => void;
}) {
  const rows = [
    { title: "Issues and Projects", sub: "Read and write, so cards can move on both sides." },
    { title: "Pull requests", sub: "Agents open draft pull requests for you to review." },
    { title: "Repository contents", sub: "Docs, decisions and designs are stored as files." },
  ];
  return (
    <OnboardingStep
      title="Connect GitHub"
      lead="Trail keeps its tasks, decisions and docs in your repository, so you see the same things on any computer."
    >
      <PanelRows rows={rows} />
      {login ? (
        <p className="tr-small" style={{ margin: 0 }}>
          Connected as <span className="tr-mono">@{login}</span>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <TrailButton variant="secondary" type="button" disabled>
              Sign in with GitHub (soon)
            </TrailButton>
            <TrailButton variant="secondary" type="button" onClick={onPatOpen}>
              Use a personal access token
            </TrailButton>
          </div>
          {patOpen ? (
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="tr-small">Personal access token (repo scope)</span>
              <input
                type="password"
                value={pat}
                onChange={(event) => onPatChange(event.target.value)}
                autoComplete="off"
                className="trail-secret-input"
                style={trailFieldStyle}
              />
              {patError ? (
                <span className="tr-small" style={{ color: "var(--warning)" }}>
                  {patError}
                </span>
              ) : null}
              <span>
                <TrailButton
                  variant="primary"
                  type="button"
                  disabled={patBusy || pat.trim() === ""}
                  onClick={onPatConnect}
                >
                  {patBusy ? "Connecting…" : "Connect"}
                </TrailButton>
              </span>
            </label>
          ) : null}
        </div>
      )}
    </OnboardingStep>
  );
}

function StepChooseRepo({
  repos,
  loading,
  selected,
  onSelect,
  integrationBranch,
  onIntegrationBranchChange,
  productionBranch,
  onProductionBranchChange,
  branchOptions,
  branchesLoading,
  branchesError,
}: {
  repos: RepoOption[];
  loading: boolean;
  selected: number;
  onSelect: (i: number) => void;
  integrationBranch: string;
  onIntegrationBranchChange: (value: string) => void;
  productionBranch: string;
  onProductionBranchChange: (value: string) => void;
  branchOptions: string[];
  branchesLoading: boolean;
  branchesError: string | null;
}) {
  return (
    <OnboardingStep title="Choose a repository" lead="Each repository becomes one workspace. You can add more later.">
      {loading ? <p className="tr-small">Loading repositories…</p> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {repos.map((r, i) => (
          <button
            key={r.fullName}
            type="button"
            aria-pressed={selected === i}
            onClick={() => onSelect(i)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              textAlign: "left",
              border: `1px solid ${selected === i ? "var(--accent-line)" : "var(--line-strong)"}`,
              borderRadius: 10,
              background: selected === i ? "var(--accent-soft)" : "var(--surface-card)",
              color: "var(--ink)",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `1px solid ${selected === i ? "var(--accent)" : "var(--line-strong)"}`,
                background: selected === i ? "var(--accent)" : "transparent",
              }}
            />
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="tr-mono" style={{ fontSize: 13 }}>
                {r.fullName}
              </span>
              <span className="tr-small">
                {r.description?.trim() || "No description"} — {r.openIssuesCount} open issues
              </span>
            </span>
          </button>
        ))}
      </div>
      {branchesLoading ? <p className="tr-small">Loading branches…</p> : null}
      {branchesError && !branchesLoading ? (
        <p className="tr-small" style={{ color: "var(--warning)" }}>
          {branchesError}
        </p>
      ) : null}
      <BranchFields
        integrationBranch={integrationBranch}
        onIntegrationBranchChange={onIntegrationBranchChange}
        productionBranch={productionBranch}
        onProductionBranchChange={onProductionBranchChange}
        branchOptions={branchOptions}
        disabled={branchesLoading || branchOptions.length === 0}
      />
    </OnboardingStep>
  );
}

function StepSetupRepo({
  importDocs,
  createLabels,
  createFolders,
  useProject,
  onImportDocs,
  onCreateLabels,
  onCreateFolders,
  onUseProject,
  localRepoRoot,
  repoRootError,
  onLocalRepoRootChange,
  onPickRepoRoot,
}: {
  importDocs: boolean;
  createLabels: boolean;
  createFolders: boolean;
  useProject: boolean;
  onImportDocs: () => void;
  onCreateLabels: () => void;
  onCreateFolders: () => void;
  onUseProject: () => void;
  localRepoRoot: string;
  repoRootError: string | null;
  onLocalRepoRootChange: (value: string) => void;
  onPickRepoRoot: () => void;
}) {
  return (
    <OnboardingStep
      title="Set up the repository"
      lead={
        <>
          Trail found <span className="tr-mono">docs/</span> with 14 files and 12 open issues. Choose what it may set up.
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 14px",
          border: "1px solid var(--line-strong)",
          borderRadius: 12,
          background: "var(--surface-card)",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>Local git checkout</span>
        <span className="tr-small">
          Required for worktrees. GitHub sync does not clone the repo for you.
        </span>
        <input
          type="text"
          value={localRepoRoot}
          onChange={(event) => onLocalRepoRootChange(event.target.value)}
          placeholder="/Users/you/projects/my-app"
          style={{
            height: 34,
            padding: "0 10px",
            border: "1px solid var(--line-strong)",
            borderRadius: 8,
            background: "var(--bg)",
            color: "var(--ink)",
            font: "inherit",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        />
        {repoRootError ? (
          <span className="tr-small" style={{ color: "var(--warning)" }}>
            {repoRootError}
          </span>
        ) : null}
        <span>
          <TrailButton variant="secondary" onClick={onPickRepoRoot}>
            Choose folder…
          </TrailButton>
        </span>
      </div>
      <div style={{ padding: "4px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
        <SetupToggle
          title="Import the docs folder"
          sub="Shows the 14 files in Docs. Nothing is moved."
          on={importDocs}
          onToggle={onImportDocs}
          border
        />
        <SetupToggle
          title="Create labels"
          sub="priority:urgent, high, medium, low, agent-ready and fix."
          on={createLabels}
          onToggle={onCreateLabels}
          border
        />
        <SetupToggle
          title="Create folders"
          sub="docs/decisions, design and .trail/config.yml, in one commit on development."
          on={createFolders}
          onToggle={onCreateFolders}
          border
        />
        <SetupToggle
          title="Use a GitHub Project"
          sub="Reads the Status field for the board columns."
          on={useProject}
          onToggle={onUseProject}
        />
      </div>
    </OnboardingStep>
  );
}

function OnboardingStep({
  title,
  lead,
  children,
}: {
  title: string;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 20, lineHeight: "28px", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--ink-muted)" }}>{lead}</p>
      </div>
      {children}
    </div>
  );
}

function PanelRows({ rows }: { rows: { title: string; sub: string }[] }) {
  return (
    <div style={{ padding: "4px 16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12 }}>
      {rows.map((row, i) => (
        <div
          key={row.title}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--line-soft)" : undefined,
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontWeight: 500 }}>{row.title}</span>
            <span className="tr-small">{row.sub}</span>
          </div>
          <TrailChip tone="gray">Needed</TrailChip>
        </div>
      ))}
    </div>
  );
}

function BranchFields({
  integrationBranch,
  onIntegrationBranchChange,
  productionBranch,
  onProductionBranchChange,
  branchOptions,
  disabled,
}: {
  integrationBranch: string;
  onIntegrationBranchChange: (value: string) => void;
  productionBranch: string;
  onProductionBranchChange: (value: string) => void;
  branchOptions: string[];
  disabled?: boolean;
}) {
  const integrationOptions =
    branchOptions.includes(integrationBranch) ? branchOptions : [integrationBranch, ...branchOptions];
  const productionOptions =
    branchOptions.includes(productionBranch) ? branchOptions : [productionBranch, ...branchOptions];

  return (
    <div style={{ display: "flex", gap: 12 }}>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="tr-small">Integration branch</span>
        <TrailSelect
          aria-label="Integration branch"
          value={integrationBranch}
          options={integrationOptions}
          onChange={onIntegrationBranchChange}
          disabled={disabled}
        />
      </label>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="tr-small">Production branch</span>
        <TrailSelect
          aria-label="Production branch"
          value={productionBranch}
          options={productionOptions}
          onChange={onProductionBranchChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
}

function SetupToggle({
  title,
  sub,
  on,
  onToggle,
  border,
}: {
  title: string;
  sub: string;
  on: boolean;
  onToggle: () => void;
  border?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 0",
        borderBottom: border ? "1px solid var(--line-soft)" : undefined,
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontWeight: 500 }}>{title}</span>
        <span className="tr-small">{sub}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        style={{
          position: "relative",
          width: 34,
          height: 20,
          padding: 0,
          borderRadius: 999,
          border: `1px solid ${on ? "var(--accent-line)" : "var(--line-strong)"}`,
          background: on ? "var(--accent-soft)" : "var(--surface-card)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 17 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: on ? "var(--accent)" : "var(--ink-faint)",
          }}
        />
      </button>
    </div>
  );
}