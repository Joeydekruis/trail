type StreamContentBlock = {
  type?: string;
  text?: string;
};

export function parseAgentStreamJsonLine(line: string): {
  sessionId: string | null;
  displayLine: string | null;
} {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) {
    return { sessionId: null, displayLine: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const sessionId = extractSessionId(parsed);
    const displayLine = extractDisplayText(parsed);
    return { sessionId, displayLine };
  } catch {
    return { sessionId: null, displayLine: trimmed };
  }
}

function extractSessionId(parsed: Record<string, unknown>): string | null {
  if (typeof parsed.session_id === "string" && parsed.session_id.trim()) {
    return parsed.session_id.trim();
  }
  if (typeof parsed.sessionId === "string" && parsed.sessionId.trim()) {
    return parsed.sessionId.trim();
  }
  return null;
}

function extractDisplayText(parsed: Record<string, unknown>): string | null {
  if (typeof parsed.result === "string" && parsed.result.trim()) {
    return parsed.result.trim();
  }
  const message = parsed.message;
  if (!message || typeof message !== "object") {
    return null;
  }
  const content = (message as { content?: unknown }).content;
  if (!Array.isArray(content)) {
    return null;
  }
  const texts = content
    .filter((block): block is StreamContentBlock => Boolean(block) && typeof block === "object")
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text?.trim())
    .filter((text): text is string => Boolean(text));
  if (texts.length === 0) {
    return null;
  }
  return texts.join("\n");
}