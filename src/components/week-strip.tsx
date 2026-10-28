import { formatMinutes } from "@/lib/time";
import { cn } from "@/lib/utils";

export type StripDay = {
  label: string;
  planned: number;
  /** Minutes the user said they have that day. null when unknown or the day has passed. */
  capacity: number | null;
  muted?: boolean;
};

/** Seven columns: how full each day is. Safe to render on the server or the client. */
export function WeekStrip({ days }: { days: StripDay[] }) {
  return (
    <ol className="grid grid-cols-7 gap-2" aria-label="Week at a glance">
      {days.map((d) => {
        const over = d.capacity !== null && d.planned > d.capacity;
        const ratio = d.capacity ? Math.min(1, d.planned / d.capacity) : d.planned > 0 ? 1 : 0;
        const h = Math.floor(d.planned / 60);
        const m = d.planned % 60;
        return (
          <li
            key={d.label}
            aria-label={`${d.label}: ${d.planned ? `${formatMinutes(d.planned)} planned` : "nothing planned"}${d.capacity ? `, ${formatMinutes(d.capacity)} available` : ""}${over ? ", over your available time" : ""}`}
            className={cn(
              "rounded-lg border border-border/80 bg-card/60 px-1 py-2.5 text-center shadow-xs transition-all hover:border-primary/40 hover:bg-card",
              d.muted && "opacity-50"
            )}
          >
            <div aria-hidden>
              <p className="text-xs font-semibold text-muted-foreground">{d.label}</p>
              <div className="mx-auto mt-2.5 flex h-14 w-3.5 items-end overflow-hidden rounded-full bg-muted/80 p-0.5">
                <div
                  className={cn("w-full rounded-full transition-all duration-500", over ? "bg-destructive" : "bg-primary")}
                  style={{ height: `${ratio * 100}%` }}
                />
              </div>
              <p className="mt-2.5 flex min-h-8 flex-col items-center justify-start text-[11px] font-medium leading-tight tabular-nums sm:min-h-4 sm:flex-row sm:justify-center sm:gap-1 sm:text-xs">
                {d.planned > 0 ? (
                  <>
                    {h > 0 && <span className="text-foreground">{h}h</span>}
                    {m > 0 && <span className="text-muted-foreground">{m}m</span>}
                  </>
                ) : (
                  <span className="text-muted-foreground/60">–</span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
