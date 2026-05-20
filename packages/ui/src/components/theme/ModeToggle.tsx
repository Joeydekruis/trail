import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border px-2 py-1",
        className,
      )}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun
        size={14}
        className={cn(
          "shrink-0 transition-colors",
          isDark ? "text-muted-foreground" : "text-amber-500",
        )}
        aria-hidden
      />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
        disabled={!mounted}
      />
      <Moon
        size={14}
        className={cn(
          "shrink-0 transition-colors",
          isDark ? "text-blue-400" : "text-muted-foreground",
        )}
        aria-hidden
      />
    </div>
  );
}
