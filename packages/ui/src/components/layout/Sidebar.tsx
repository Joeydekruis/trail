import {
  LayoutGrid,
  List,
  Clock,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DocSidebarTree } from "@/components/docs/DocSidebarTree";
import type { DocTreeEntry } from "@/types/document";

export type AppView = "kanban" | "list" | "settings";

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  openCount: number;
  closedCount: number;
  docTree: DocTreeEntry[];
  selectedDocPath: string | null;
  onSelectDoc: (path: string) => void;
  onClearDoc: () => void;
  onCreateDoc: (folder?: string) => void;
  onCreateFolder: (parentFolder?: string) => void;
}

const navItems: {
  view: AppView | null;
  label: string;
  icon: typeof LayoutGrid;
  disabled?: boolean;
  badge?: string;
}[] = [
  { view: "kanban", label: "Kanban", icon: LayoutGrid },
  { view: "list", label: "List", icon: List },
  { view: null, label: "Timeline", icon: Clock, disabled: true, badge: "soon" },
  { view: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapsed,
  openCount,
  closedCount,
  docTree,
  selectedDocPath,
  onSelectDoc,
  onClearDoc,
  onCreateDoc,
  onCreateFolder,
}: SidebarProps) {
  function selectView(view: AppView) {
    onClearDoc();
    onViewChange(view);
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-background transition-[width] duration-200",
        collapsed ? "w-[52px]" : "w-[240px]",
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
          T
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wider text-foreground">
            TRAIL
          </span>
        )}
      </div>

      <nav className="shrink-0 space-y-0.5 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.view !== null &&
            item.view === activeView &&
            selectedDocPath === null;

          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              disabled={item.disabled}
              onClick={() => {
                if (item.view) selectView(item.view);
              }}
              className={cn(
                "h-auto w-full justify-start gap-2 px-2.5 py-1.5 text-sm font-normal",
                isActive
                  ? "bg-primary/10 text-blue-500 dark:text-blue-400"
                  : "text-muted-foreground",
                item.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      <div className="mx-2 border-t border-border" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DocSidebarTree
          tree={docTree}
          selectedPath={selectedDocPath}
          collapsed={collapsed}
          onSelectDoc={(path) => {
            onSelectDoc(path);
          }}
          onCreateDoc={onCreateDoc}
          onCreateFolder={onCreateFolder}
        />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border p-2">
        <div className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <GitBranch size={14} className="shrink-0" />
          {!collapsed && <span className="truncate">main</span>}
        </div>

        {!collapsed && (
          <div className="flex items-center gap-3 px-2 text-xs">
            <span className="text-green-600 dark:text-green-400">{openCount} open</span>
            <span className="text-muted-foreground">{closedCount} closed</span>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleCollapsed}
          className="w-full"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </aside>
  );
}
