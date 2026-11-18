import { useState, type ReactNode } from "react";
import { TrailLogo } from "./design/TrailIcons";
import { TrailButton, TrailChip } from "./design/TrailUi";

const STEPS = ["Connect GitHub", "Choose a repository", "Set up the repository"] as const;

const REPOS = [
  { name: "joeydekruijs/trail", desc: "Trail desktop — 12 open issues" },
  { name: "joeydekruijs/loupe", desc: "Loupe — 4 open issues" },
  { name: "joeydekruijs/dockyrd", desc: "Dockyrd — 2 open issues" },
];

type OnboardingViewProps = {
  onComplete: () => void;
  onBack?: () => void;
};

export function OnboardingView({ onComplete, onBack }: OnboardingViewProps) {
  const [step, setStep] = useState(0);
  const [selectedRepo, setSelectedRepo] = useState(0);
  const [importDocs, setImportDocs] = useState(true);
  const [createLabels, setCreateLabels] = useState(true);
  const [createFolders, setCreateFolders] = useState(true);
  const [useProject, setUseProject] = useState(true);

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

      {step === 0 ? <StepConnectGitHub /> : null}
      {step === 1 ? (
        <StepChooseRepo selected={selectedRepo} onSelect={setSelectedRepo} />
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
          {step < 2 ? (
            <TrailButton variant="primary" onClick={() => setStep((s) => s + 1)}>
              Continue
            </TrailButton>
          ) : (
            <TrailButton variant="primary" onClick={onComplete}>
              Open workspace
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

function StepConnectGitHub() {
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
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <TrailButton variant="primary" type="button">
          Sign in with GitHub
        </TrailButton>
        <TrailButton variant="secondary" type="button">
          Use a personal access token
        </TrailButton>
      </div>
    </OnboardingStep>
  );
}

function StepChooseRepo({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  return (
    <OnboardingStep title="Choose a repository" lead="Each repository becomes one workspace. You can add more later.">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REPOS.map((r, i) => (
          <button
            key={r.name}
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
                {r.name}
              </span>
              <span className="tr-small">{r.desc}</span>
            </span>
          </button>
        ))}
      </div>
      <BranchFields />
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
}: {
  importDocs: boolean;
  createLabels: boolean;
  createFolders: boolean;
  useProject: boolean;
  onImportDocs: () => void;
  onCreateLabels: () => void;
  onCreateFolders: () => void;
  onUseProject: () => void;
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

function BranchFields() {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="tr-small">Integration branch</span>
        <input
          readOnly
          defaultValue="development"
          style={{
            height: 32,
            padding: "0 10px",
            border: "1px solid var(--line-strong)",
            borderRadius: 8,
            background: "var(--bg)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        />
      </label>
      <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="tr-small">Production branch</span>
        <input
          readOnly
          defaultValue="main"
          style={{
            height: 32,
            padding: "0 10px",
            border: "1px solid var(--line-strong)",
            borderRadius: 8,
            background: "var(--bg)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
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