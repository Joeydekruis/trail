const STEPS = [
  {
    title: "Connect GitHub",
    detail:
      "Issues, Projects, pull requests, and contents for repos you choose.",
  },
  {
    title: "Choose a repository",
    detail:
      "One workspace per repo; set integration and production branches.",
  },
  {
    title: "Set up the repository",
    detail:
      "Labels, design/, and .trail/config.yml on development — review before push.",
  },
] as const;

export function OnboardingPlaceholder() {
  const active = 0;

  return (
    <div className="onboarding">
      <div className="onboarding-progress" aria-hidden>
        {STEPS.map((_, i) => (
          <span
            key={STEPS[i].title}
            className={
              i <= active
                ? "onboarding-dot onboarding-dot--active"
                : "onboarding-dot"
            }
          />
        ))}
      </div>
      <h1 className="onboarding-title">Welcome to Trail</h1>
      <p className="onboarding-lead">
        Three steps to link GitHub and prepare your first workspace. (Placeholder
        — no API calls yet.)
      </p>
      <ol className="onboarding-steps">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className={
              i === active
                ? "onboarding-step onboarding-step--active"
                : "onboarding-step"
            }
          >
            <span className="onboarding-step-num">{i + 1}</span>
            <div className="onboarding-step-body">
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="onboarding-cta" disabled>
        Continue
      </button>
    </div>
  );
}