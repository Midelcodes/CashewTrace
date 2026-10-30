import type { ReactNode } from "react";
import { GenderAgeChart, GradeChart, KorHistogram, TonnesByMonthChart } from "@/components/impact/ImpactCharts";
import { INCLUSION_TARGET_PCT, type ImpactData } from "@/lib/impact";
import { formatNaira, formatNairaCompact, formatTonnes } from "@/lib/money";

const fmtPct = (n: number | null) => (n === null ? "n/a" : `${Math.round(n)}%`);

/** KPI tiles + charts. Aggregates only, so the same view serves the hub and the public /impact page. */
export function ImpactView({ data, periodLabel }: { data: ImpactData; periodLabel: string }) {
  const { farmers, volume, quality, money, environment, charts } = data;

  return (
    <div className="flex flex-col gap-6">
      <Group title="Farmers" note="Registered farmers (all seasons)">
        <Tile label="Farmers registered" value={String(farmers.registered)} sub={`${farmers.active} delivered in ${periodLabel}`} />
        <Tile label="Women" value={fmtPct(farmers.womenPct)} sub="of registered farmers" />
        <Tile label="Youth (18–35)" value={fmtPct(farmers.youthPct)} sub="of registered farmers" />
        <InclusionTile value={farmers.womenOrYouthPct} />
      </Group>

      <Group title="Volume" note={periodLabel}>
        <Tile label="Lots received" value={String(volume.lots)} />
        <Tile label="Tonnes received" value={formatTonnes(volume.kgReceived)} />
        <Tile label="Tonnes sold" value={formatTonnes(volume.kgSold)} sub={`${money.sales} sales`} />
      </Group>

      <Group title="Quality" note={`${quality.tested} tested lots`}>
        <Tile label="Average KOR" value={quality.avgKor === null ? "n/a" : quality.avgKor.toFixed(1)} sub="lbs per 80 kg bag" />
        <Tile label="Grade A or B" value={fmtPct(quality.abPct)} sub="of tested lots" />
        <Tile label="Rejection rate" value={fmtPct(quality.rejectionPct)} sub={`${quality.rejected} of ${volume.lots} lots received`} />
        <Tile
          label="Moisture reduction"
          value={quality.moistureDrop === null ? "n/a" : `−${quality.moistureDrop.toFixed(1)} pts`}
          sub="average, before → after solar drying"
        />
      </Group>

      <Group title="Money" note={`${periodLabel} · recorded sales`}>
        <Tile label="Commission earned" value={formatNairaCompact(money.commissionNgn)} sub={`${formatNaira(money.commissionNgn)} · paid by buyers`} />
        <Tile label="Paid to farmers" value={formatNairaCompact(money.paidNgn)} sub={`${formatNaira(money.paidNgn)} after fees`} />
        <Tile
          label="Average payout per farmer"
          value={money.avgPayoutNgn === null ? "n/a" : formatNairaCompact(money.avgPayoutNgn)}
          sub={money.avgPayoutNgn === null ? "No sales yet" : `${formatNaira(money.avgPayoutNgn)} · ${money.farmersPaid} farmers paid`}
        />
      </Group>

      <Group title="Environment" note={periodLabel}>
        <Tile
          label="Post-harvest loss avoided"
          value={formatTonnes(environment.lossAvoidedKg)}
          badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">Estimated</span>}
        >
          <details className="mt-2 text-xs text-ink/70">
            <summary className="cursor-pointer font-medium text-brand" title="Tonnes solar-dried × spoilage-avoided factor">
              How is this estimated?
            </summary>
            <p className="mt-1">
              Tonnes solar-dried ({formatTonnes(volume.kgDried)}) × spoilage-avoided factor (
              {Math.round(environment.spoilageFactor * 1000) / 10}%) = {formatTonnes(environment.lossAvoidedKg)}. The factor
              is an assumption set by an admin in Settings, to be calibrated with field data. It is not a measurement.
            </p>
          </details>
        </Tile>
        <Tile
          label="Fuel avoided"
          value={environment.solarPct === null || environment.solarPct === 100 ? "100% solar drying" : `${fmtPct(environment.solarPct)} solar`}
          sub={`${environment.dieselLitres} litres of diesel used`}
        />
      </Group>

      <div className="grid gap-4 lg:grid-cols-2">
        <TonnesByMonthChart data={charts.tonnesByMonth} />
        <GradeChart data={charts.grades} />
        <KorHistogram data={charts.korHistogram} thresholds={charts.thresholds} />
        <GenderAgeChart data={charts.genderAge} />
      </div>
    </div>
  );
}

function Group({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink/70">{title}</h2>
        {note && <p className="text-xs text-ink/70">{note}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Tile({
  label,
  value,
  sub,
  badge,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-ink/70">{label}</p>
        {badge}
      </div>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink/70">{sub}</p>}
      {children}
    </div>
  );
}

/** Women-or-youth share as a meter against the programme target (status shown with icon + text, not colour alone). */
function InclusionTile({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="flex flex-col rounded-2xl bg-white p-4 ring-1 ring-black/5">
        <p className="text-xs text-ink/70">Women or youth</p>
        <p className="mt-1 text-2xl font-bold text-ink">n/a</p>
        <p className="mt-0.5 text-xs text-ink/70">No farmers registered yet · target {INCLUSION_TARGET_PCT}%</p>
      </div>
    );
  }
  const met = value >= INCLUSION_TARGET_PCT;
  return (
    <div className={`flex flex-col rounded-2xl p-4 ring-2 ${met ? "bg-green-50 ring-green-700/40" : "bg-amber-50 ring-amber-500/50"}`}>
      <p className="text-xs text-ink/70">Women or youth</p>
      <p className="mt-1 text-2xl font-bold text-ink">{fmtPct(value)}</p>
      <div className="relative mt-2 h-2.5 rounded-full bg-black/10" role="meter" aria-valuenow={value ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Women or youth share">
        <div className={`h-full rounded-full ${met ? "bg-green-700" : "bg-amber-500"}`} style={{ width: `${Math.min(100, value ?? 0)}%` }} />
        <span className="absolute -top-1 h-4.5 w-0.5 bg-ink" style={{ left: `${INCLUSION_TARGET_PCT}%` }} aria-hidden="true" />
      </div>
      <p className={`mt-1.5 text-xs font-semibold ${met ? "text-green-800" : "text-amber-900"}`}>
        {met ? "✓ Above" : "⚠ Below"} the {INCLUSION_TARGET_PCT}% target
      </p>
    </div>
  );
}
