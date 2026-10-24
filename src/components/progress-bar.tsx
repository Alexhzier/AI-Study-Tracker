import { cn } from "@/lib/utils";

export function ProgressBar({
  value, max, label, color, size = "md", className,
}: { value: number; max: number; label: string; color?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
      className={cn("overflow-hidden rounded-full bg-muted", size === "sm" ? "h-1" : size === "lg" ? "h-2" : "h-1.5", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}
