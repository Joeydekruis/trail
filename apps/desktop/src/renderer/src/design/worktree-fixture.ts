export type ChatLine = {
  who: string;
  initials: string;
  tone: "mint" | "blue";
  time: string;
  body: string;
  chip?: { text: string; tone: "gray" | "violet" };
  monoLines?: string[];
};

export type TaskStep = {
  label: string;
  done: boolean;
  active?: boolean;
};

export function getWorktreeFixture() {
  return {
    issue: "#42",
    title: "Fix redirect after sign-in",
    statusChip: "Running",
    meta: "agent/42-fix-redirect · Cursor CLI · 04:12",
    messages: [
      {
        who: "You",
        initials: "JK",
        tone: "mint",
        time: "14:02",
        chip: { text: "From task #42", tone: "gray" },
        body: "Fix the redirect after sign-in. Users land on the dashboard instead of the page they came from.",
      },
      {
        who: "Cursor",
        initials: "CU",
        tone: "blue",
        time: "14:03",
        body: "Found it. The sign-in handler ignores the next parameter. I am reading it, checking that it is a local path, and redirecting there.",
        monoLines: ["› Edited src/auth/redirect.ts", "› Edited src/auth/redirect.test.ts"],
      },
      {
        who: "Cursor",
        initials: "CU",
        tone: "blue",
        time: "14:05",
        body: "Tests pass. The preview is running, so you can try the sign-in.",
        monoLines: ["› Running tests: 12 passed, 0 failed", "› Dev server on localhost:3000"],
      },
      {
        who: "You",
        initials: "JK",
        tone: "mint",
        time: "14:07",
        chip: { text: "From preview comment", tone: "violet" },
        body: 'Pin 1: "The button should stay disabled while the request is running."\nlocalhost:3000/sign-in · Sign in button',
      },
      {
        who: "Cursor",
        initials: "CU",
        tone: "blue",
        time: "14:08",
        body: "Good catch. Adding a loading state that disables the button, then I will re-run the tests.",
        monoLines: ["› Editing src/auth/SignInForm.tsx"],
      },
    ] satisfies ChatLine[],
    steps: [
      { label: "Read the next parameter", done: true },
      { label: "Check it is a local path", done: true },
      { label: "Add redirect tests", done: true },
      { label: "Disable the button while loading", done: false, active: true },
      { label: "Open a draft pull request", done: false },
    ] satisfies TaskStep[],
    progressPct: 60,
    progressNote: "3 of 5 steps done",
    git: {
      branch: "agent/42-fix-redirect",
      base: "development",
      folder: "~/trail-worktrees/42",
      changes: "3 files, +41 -6",
      pr: "Not opened yet",
    },
  };
}