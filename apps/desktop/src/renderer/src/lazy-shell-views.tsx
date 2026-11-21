import { lazy } from "react";

export const LazyDecisionsView = lazy(() =>
  import("./DecisionsView").then((mod) => ({ default: mod.DecisionsView })),
);
export const LazyDocsView = lazy(() => import("./DocsView").then((mod) => ({ default: mod.DocsView })));
export const LazyDesignsView = lazy(() =>
  import("./DesignsView").then((mod) => ({ default: mod.DesignsView })),
);
export const LazyRoadmapView = lazy(() =>
  import("./RoadmapView").then((mod) => ({ default: mod.RoadmapView })),
);

export function ShellViewFallback({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 48,
        textAlign: "center",
        color: "var(--ink-muted)",
      }}
      role="status"
    >
      Loading {label}…
    </div>
  );
}