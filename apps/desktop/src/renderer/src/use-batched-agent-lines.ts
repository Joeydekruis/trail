import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { ChatLine } from "./design/worktree-fixture";
import { agentOutputToChatLine } from "./agent-chat-line";

const BATCH_MS = 100;

/** Buffers agent IPC lines and flushes at most once per 100ms (performance briefing). */
export function useBatchedAgentLines(
  workspaceId: string | undefined,
  issueNumber: number,
  setExtraMessages: Dispatch<SetStateAction<ChatLine[]>>,
): void {
  const bufferRef = useRef<ChatLine[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useRef(() => {
    if (bufferRef.current.length === 0) {
      return;
    }
    const batch = bufferRef.current;
    bufferRef.current = [];
    setExtraMessages((prev) => [...prev, ...batch]);
  });

  useEffect(() => {
    const api = window.trail;
    if (!api?.onAgentOutput || !workspaceId) {
      return;
    }
    return api.onAgentOutput((payload) => {
      if (payload.workspaceId !== workspaceId || payload.issueNumber !== issueNumber) {
        return;
      }
      bufferRef.current.push(agentOutputToChatLine(payload));
      if (timerRef.current !== null) {
        return;
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        flush.current();
      }, BATCH_MS);
    });
  }, [workspaceId, issueNumber]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      flush.current();
    },
    [workspaceId, issueNumber],
  );
}