import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ percent, className, showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const isComplete = clamped === 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 rounded-full bg-[#1e2d3d]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isComplete ? "bg-green-500" : "bg-blue-500",
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[#8b9cb6]">{clamped}%</span>
      )}
    </div>
  );
}
