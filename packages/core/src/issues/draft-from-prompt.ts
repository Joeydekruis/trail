import type { NewIssuePriority, NewIssueType } from "./create-labels.js";

export type IssueChatDraft = {
  title: string;
  body: string;
  type: NewIssueType;
  priority: NewIssuePriority;
  acceptance: string[];
};

function firstTitleLine(prompt: string): string {
  const line = prompt
    .split(/\n/)
    .map((row) => row.trim())
    .find(Boolean);
  if (!line) {
    return "New task";
  }
  const sentence = line.split(/(?<=[.!?])\s+/)[0]?.trim() ?? line;
  const trimmed = sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function inferType(prompt: string): NewIssueType {
  const lower = prompt.toLowerCase();
  if (/\b(bug|fix|broken|regression|crash)\b/.test(lower)) {
    return "bug";
  }
  if (/\b(doc|docs|readme|documentation)\b/.test(lower)) {
    return "docs";
  }
  if (/\b(chore|refactor|cleanup|deps|dependency)\b/.test(lower)) {
    return "chore";
  }
  return "feature";
}

function inferPriority(prompt: string): NewIssuePriority {
  const lower = prompt.toLowerCase();
  if (/\b(urgent|blocker|p0|critical)\b/.test(lower)) {
    return "urgent";
  }
  if (/\b(high|important|p1)\b/.test(lower)) {
    return "high";
  }
  if (/\b(low|minor|trivial|p3)\b/.test(lower)) {
    return "low";
  }
  return "medium";
}

/** Turns free-form chat input into an issue draft (local heuristics, no model call). */
export function draftIssueFromPrompt(prompt: string): IssueChatDraft {
  const trimmed = prompt.trim();
  const title = firstTitleLine(trimmed);
  const type = inferType(trimmed);
  const priority = inferPriority(trimmed);
  const acceptance = [
    "The change works as described above",
    "Existing behaviour keeps working and has a test",
  ];
  const body = `${trimmed}

## Acceptance criteria
- ${acceptance[0]}
- ${acceptance[1]}`;

  return { title, body, type, priority, acceptance };
}