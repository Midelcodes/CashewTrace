"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GRADE_HEX } from "@/components/ui/badges";

// Chart styling follows one spec: thin bars (≤24px) with 4px rounded ends, hairline recessive grid,
// text in ink tokens (never series colours), legend for ≥2 series, and a data table behind every chart.

type Grade = "A" | "B" | "C" | "FAIL";
export type ChartData = {
  tonnesByMonth: { key: string; label: string; tonnes: number }[];
  grades: { grade: Grade; lots: number }[];
  korHistogram: { bin: string; from: number; lots: number; band: Grade }[];
  genderAge: { group: string; youth: number; adult: number }[];
  thresholds: { A: number; B: number; C: number };
};

// Validated two-series pair (CVD-safe on white): green for youth, orange for 36+.
const SERIES = { youth: "#2e8b57", adult: "#c8571a" };
const VOLUME = "#2e8b57";
const GRID = "#ebe8e2";
const AXIS_TEXT = { fontSize: 11, fill: "#6b6b6b" };
const tooltipStyle = {
  contentStyle: { borderRadius: 12, border: "1px solid #e5e2dc", fontSize: 13, color: "#1e1e1e" },
  itemStyle: { color: "#1e1e1e" }, // tooltip text in ink, never the series colour
  labelStyle: { color: "#1e1e1e", fontWeight: 600 },
  cursor: { fill: "rgba(0,0,0,0.04)" },
};
const GRADE_LABEL: Record<Grade, string> = { A: "Grade A", B: "Grade B", C: "Grade C", FAIL: "Fail" };

function ChartCard({
  title,
  subtitle,
  table,
  empty,
  children,
}: {
  title: string;
  subtitle?: string;
  table: { head: string[]; rows: (string | number)[][] };
  empty?: boolean;
  children: ReactNode;
}) {
  if (empty) {
    return (
      <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
        <h3 className="font-bold">{title}</h3>
        <p className="mt-6 mb-4 rounded-xl bg-cream p-6 text-center text-sm text-ink/70">No data for this period yet.</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
      <h3 className="font-bold">{title}</h3>
      {subtitle && <p className="text-xs text-ink/70">{subtitle}</p>}
      <div className="mt-3">{children}</div>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-brand">Show data</summary>
        <table className="mt-2 w-full text-left text-xs tabular-nums">
          <thead>
            <tr className="border-b border-black/10 text-ink/70">
              {table.head.map((h) => (
                <th key={h} className="py-1 pr-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-b border-black/5">
                {r.map((c, j) => (
                  <td key={j} className="py-1 pr-2">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function SwatchLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/80">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: i.color }} aria-hidden="true" />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function TonnesByMonthChart({ data }: { data: ChartData["tonnesByMonth"] }) {
  const total = data.reduce((s, d) => s + d.tonnes, 0);
  return (
    <ChartCard
      title="Tonnes received per month"
      empty={total === 0}
      subtitle={`${total.toFixed(1)} t received · raw cashew nuts at intake`}
      table={{ head: ["Month", "Tonnes"], rows: data.map((d) => [d.key, d.tonnes.toFixed(2)]) }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: GRID }} tick={AXIS_TEXT} interval="preserveStartEnd" minTickGap={4} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toFixed(2)} t`, "Received"]} />
          <Bar dataKey="tonnes" fill={VOLUME} radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function GradeChart({ data }: { data: ChartData["grades"] }) {
  const total = data.reduce((s, d) => s + d.lots, 0);
  const rows = data.map((d) => ({
    ...d,
    label: GRADE_LABEL[d.grade],
    tip: `${d.lots} (${total ? Math.round((d.lots / total) * 100) : 0}%)`,
  }));
  return (
    <ChartCard
      title="Grade distribution"
      empty={total === 0}
      subtitle={`${total} tested lots`}
      table={{ head: ["Grade", "Lots", "Share"], rows: rows.map((r) => [r.label, r.lots, total ? `${Math.round((r.lots / total) * 100)}%` : "—"]) }}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, left: 4, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ ...AXIS_TEXT, fill: "#1e1e1e" }} width={64} />
          <Tooltip {...tooltipStyle} formatter={(v) => [`${v} lots`, "Tested"]} />
          <Bar dataKey="lots" radius={[0, 4, 4, 0]} maxBarSize={24}>
            {rows.map((r) => (
              <Cell key={r.grade} fill={GRADE_HEX[r.grade]} />
            ))}
            <LabelList dataKey="tip" position="right" style={{ fontSize: 12, fill: "#1e1e1e" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function KorHistogram({ data, thresholds }: { data: ChartData["korHistogram"]; thresholds: ChartData["thresholds"] }) {
  return (
    <ChartCard
      title="KOR distribution"
      empty={data.every((d) => d.lots === 0)}
      subtitle="Tested lots per 1 lb band · lbs of kernel per 80 kg bag"
      table={{ head: ["KOR band (lbs)", "Lots", "Grade band"], rows: data.map((d) => [`${d.from}–${d.from + 0.9}`, d.lots, GRADE_LABEL[d.band]]) }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="bin" tickLine={false} axisLine={{ stroke: GRID }} tick={AXIS_TEXT} interval="preserveStartEnd" minTickGap={2} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals={false} />
          <Tooltip
            {...tooltipStyle}
            labelFormatter={(l) => `KOR ${l}–${Number(l) + 0.9} lbs`}
            formatter={(v) => [`${v} lots`, "Tested"]}
          />
          <Bar dataKey="lots" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((d) => (
              <Cell key={d.bin} fill={GRADE_HEX[d.band]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <SwatchLegend
        items={[
          { color: GRADE_HEX.FAIL, label: `Below ${thresholds.C} (fail)` },
          { color: GRADE_HEX.C, label: `C ≥ ${thresholds.C}` },
          { color: GRADE_HEX.B, label: `B ≥ ${thresholds.B}` },
          { color: GRADE_HEX.A, label: `A ≥ ${thresholds.A}` },
        ]}
      />
    </ChartCard>
  );
}

export function GenderAgeChart({ data }: { data: ChartData["genderAge"] }) {
  return (
    <ChartCard
      title="Farmers by gender and age group"
      empty={data.every((d) => d.youth + d.adult === 0)}
      subtitle="Registered farmers"
      table={{ head: ["Group", "Youth 18–35", "36 and over"], rows: data.map((d) => [d.group, d.youth, d.adult]) }}
    >
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 20, right: 4, left: -18, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="group" tickLine={false} axisLine={{ stroke: GRID }} tick={{ ...AXIS_TEXT, fill: "#1e1e1e", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={AXIS_TEXT} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="youth" name="Youth 18–35" fill={SERIES.youth} radius={[4, 4, 0, 0]} maxBarSize={24}>
            <LabelList dataKey="youth" position="top" style={{ fontSize: 12, fill: "#1e1e1e" }} />
          </Bar>
          <Bar dataKey="adult" name="36 and over" fill={SERIES.adult} radius={[4, 4, 0, 0]} maxBarSize={24}>
            <LabelList dataKey="adult" position="top" style={{ fontSize: 12, fill: "#1e1e1e" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <SwatchLegend
        items={[
          { color: SERIES.youth, label: "Youth 18–35" },
          { color: SERIES.adult, label: "36 and over" },
        ]}
      />
    </ChartCard>
  );
}
