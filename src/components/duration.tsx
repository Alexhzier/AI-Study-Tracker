import { formatMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

const SIZES = {
  display: { num: "text-display font-semibold", unit: "text-lg font-medium" },
  lg: { num: "text-xl font-semibold", unit: "text-sm font-medium" },
  base: { num: "text-sm", unit: "text-xs" },
} as const;

/** 85 -> "1h 25m" with quiet unit labels. Exact minutes, never rounded decimals. */
export function Duration({
  minutes, size = "base", className,
}: { minutes: number; size?: keyof typeof SIZES; className?: string }) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const { num, unit } = SIZES[size];
  const part = (value: number, label: string) => (
    <span className="inline-flex items-baseline gap-0.5" aria-hidden>
      <span className={num}>{value}</span>
      <span className={cn(unit, "text-muted-foreground")}>{label}</span>
    </span>
  );
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 tabular-nums", className)}>
      <span className="sr-only">{formatMinutes(minutes)}</span>
      {h > 0 && part(h, "h")}
      {(m > 0 || h === 0) && part(m, "m")}
    </span>
  );
}
