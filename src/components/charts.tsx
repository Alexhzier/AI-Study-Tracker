"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point, SubjectSlice } from "@/lib/analytics";
import { formatMinutes } from "@/lib/time";

const tick = { fill: "var(--muted-foreground)", fontSize: 12 };

function TipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/80 bg-popover/95 px-3.5 py-2 text-xs text-popover-foreground shadow-md backdrop-blur-xs">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 tabular-nums font-medium text-muted-foreground">{value}</p>
    </div>
  );
}

function BarTip({ active, payload }: { active?: boolean; payload?: readonly { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return <TipBox title={p.title} value={p.minutes > 0 ? formatMinutes(p.minutes) : "No study"} />;
}

export function HoursBarChart({
  data, label, emptyText = "No study time in this period.",
}: { data: Point[]; label: string; emptyText?: string }) {
  const empty = data.every((d) => d.minutes === 0);
  const hasCurrent = data.some((d) => d.current);

  return (
    <div>
      {empty ? (
        <div className="grid h-56 place-items-center text-sm text-muted-foreground sm:h-64">{emptyText}</div>
      ) : (
        <div className="h-56 w-full sm:h-64" role="img" aria-label={label}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
              <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: "var(--border)" }} tickMargin={8} interval="preserveStartEnd" minTickGap={14} />
              <YAxis
                tick={tick} tickLine={false} axisLine={false} width={54} tickCount={4}
                tickFormatter={(v) => formatMinutes(Math.round(Number(v) * 60))}
              />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<BarTip />} />
              <Bar dataKey="hours" radius={[5, 5, 0, 0]} maxBarSize={38}>
                {data.map((d, i) => (
                  <Cell key={i} fill="var(--primary)" fillOpacity={!hasCurrent || d.current ? 1 : 0.45} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* The same numbers as a table, for screen readers. */}
      <table className="sr-only">
        <caption>{label}</caption>
        <thead><tr><th>Period</th><th>Time studied</th></tr></thead>
        <tbody>
          {data.map((d, i) => <tr key={i}><td>{d.title}</td><td>{formatMinutes(d.minutes)}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

function SliceTip({ active, payload, total }: { active?: boolean; payload?: readonly { payload: SubjectSlice }[]; total: number }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return <TipBox title={s.name} value={`${formatMinutes(s.minutes)} · ${Math.round((s.minutes / total) * 100)}%`} />;
}

export function SubjectPie({ data }: { data: SubjectSlice[] }) {
  const total = data.reduce((n, s) => n + s.minutes, 0);
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-48 shrink-0" role="img" aria-label="Study time by subject">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="minutes" nameKey="name" innerRadius="68%" outerRadius="96%" stroke="var(--card)" strokeWidth={3} startAngle={90} endAngle={-270}>
              {data.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip content={<SliceTip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</p>
            <p className="text-xl font-bold tracking-tight tabular-nums text-foreground">{formatMinutes(total)}</p>
          </div>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2.5 text-sm">
        {data.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatMinutes(s.minutes)} <span className="ml-1 inline-block w-9 text-right">{Math.round((s.minutes / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
