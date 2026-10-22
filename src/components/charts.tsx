"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point, SubjectSlice } from "@/lib/analytics";
import { formatMinutes } from "@/lib/time";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};
const tick = { fill: "var(--muted-foreground)", fontSize: 12 };
const asTime = (hours: unknown) => formatMinutes(Math.round(Number(hours) * 60));

export function HoursBarChart({ data, label }: { data: Point[]; label: string }) {
  return (
    <div className="h-60 w-full" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals tickFormatter={(v) => `${v}h`} width={44} />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            contentStyle={tooltipStyle}
            formatter={(v) => [asTime(v), "Studied"]}
          />
          <Bar dataKey="hours" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubjectPie({ data }: { data: SubjectSlice[] }) {
  const total = data.reduce((n, s) => n + s.minutes, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-52 w-52 shrink-0" role="img" aria-label="Study time by subject">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="hours" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={data.length > 1 ? 2 : 0} stroke="none">
              {data.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [asTime(v), String(name)]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {data.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
              <span className="truncate">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatMinutes(s.minutes)} · {Math.round((s.minutes / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
