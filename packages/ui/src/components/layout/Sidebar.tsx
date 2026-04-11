import {
  LayoutGrid,
  List,
  Clock,
  ChevronLeft,
  ChevronRight,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/cn";

type View = "kanban" | "list";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  openCount: number;
  closedCount: number;
}

const navItems: {
  view: View | null;
  label: string;
  icon: typeof LayoutGrid;
  disabled?: boolean;
  badge?: string;
}[] = [
  { view: "kanban", label: "Kanban", icon: LayoutGrid },
  { view: "list", label: "List", icon: List },
  { view: null, label: "Timeline", icon: Clock, disabled: true, badge: "soon" },
];

export function Sidebar({
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapsed,
  openCount,
  closedCount,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-[#1e2d3d] bg-[#0a0f1a] transition-[width] duration-200",
        collapsed ? "w-[52px]" : "w-[200px]",
      )}
    >
      {/* Logo */}
      <div className="flex h-12 items-center gap-2 border-b border-[#1e2d3d] px-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
          T
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wider text-[#e2e8f0]">
            TRAIL
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.view !== null && item.view === activeView;

          return (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                if (item.view) onViewChange(item.view);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-[#8b9cb6] hover:bg-[#1a2332] hover:text-[#e2e8f0]",
                item.disabled && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon size={16} className="shrink-0" />
              {!collapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded bg-[#1e2d3d] px-1.5 py-0.5 text-[10px] leading-none text-[#8b9cb6]">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-2 border-t border-[#1e2d3d] p-2">
        {/* Branch */}
        <div className="flex items-center gap-1.5 px-2 text-xs text-[#8b9cb6]">
          <GitBranch size={14} className="shrink-0" />
          {!collapsed && <span className="truncate">main</span>}
        </div>

        {/* Counts */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 text-xs">
            <span className="text-green-400">{openCount} open</span>
            <span className="text-[#8b9cb6]">{closedCount} closed</span>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapsed}
          className="flex w-full items-center justify-center rounded-md py-1 text-[#8b9cb6] hover:bg-[#1a2332] hover:text-[#e2e8f0]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}
