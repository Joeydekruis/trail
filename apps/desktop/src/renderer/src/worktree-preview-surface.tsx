import { useEffect, useRef, type ReactNode } from "react";

type WorktreePreviewSurfaceProps = {
  workspaceId: string;
  issueNumber: number;
  url: string;
  active: boolean;
  children?: ReactNode;
};

export function WorktreePreviewSurface({
  workspaceId,
  issueNumber,
  url,
  active,
  children,
}: WorktreePreviewSurfaceProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = window.trail;
    if (!active || !api?.previewAttach) {
      if (api?.previewDetach) {
        void api.previewDetach({ workspaceId, issueNumber });
      }
      return;
    }
    void api.previewAttach({ workspaceId, issueNumber, url });
    return () => {
      void api.previewDetach?.({ workspaceId, issueNumber });
    };
  }, [active, workspaceId, issueNumber, url]);

  useEffect(() => {
    const api = window.trail;
    const el = hostRef.current;
    if (!active || !api?.previewSetBounds || !el) {
      return;
    }

    const report = () => {
      const rect = el.getBoundingClientRect();
      void api.previewSetBounds?.({
        workspaceId,
        issueNumber,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    };

    const observer = new ResizeObserver(report);
    observer.observe(el);
    report();
    return () => observer.disconnect();
  }, [active, workspaceId, issueNumber]);

  return (
    <div
      ref={hostRef}
      data-preview-host=""
      style={{
        position: "relative",
        flex: 1,
        minHeight: 0,
        background: "var(--bg-elevated, #111)",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}