import type { LotStatus } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LotTimeline } from "@/components/LotTimeline";
import { SiteFooter, SiteHeader } from "@/components/public/SiteChrome";
import { GRADE_STYLE } from "@/components/ui/badges";
import { formatDate, MONTHS } from "@/lib/format";
import type { GradingThresholds } from "@/lib/grading";
import { formatKg, formatTonnes } from "@/lib/money";
import { getPublicLot, type PublicLot } from "@/lib/public-lot";
import { getSettings } from "@/lib/settings";
import { InterestForm } from "./InterestForm";

type Props = { params: Promise<{ lotCode: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lot = await getPublicLot((await params).lotCode);
  if (!lot) return { title: "Lot not found · CashewTrace", robots: { index: false } };

  const gradeText = lot.test && lot.test.grade !== "FAIL" ? `Grade ${lot.test.grade}` : "Quality-tracked";
  const title = `✓ Verified cashew lot ${lot.lotCode} · ${gradeText}`;
  const description = [
    lot.test && `KOR ${lot.test.korLbs.toFixed(1)} lbs/80 kg`,
    lot.test && `moisture ${lot.test.moistureAfter}%`,
    `${formatKg(lot.weightKg)} from ${lot.origin.community}, ${lot.origin.state} State, Nigeria`,
    `${lot.season} season`,
  ]
    .filter(Boolean)
    .join(" · ")
    .concat(". CashewTrace prototype · demo data.");

  return {
    title,
    description,
    robots: { index: false }, // demo data — keep out of search results
    openGraph: {
      title,
      description,
      url: `/v/${lot.lotCode}`,
      siteName: "CashewTrace",
      type: "website",
      locale: "en_NG",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const STATUS_INFO: Record<LotStatus, { label: string; text: string; tone: string }> = {
  LISTED: { label: "Available", text: "Open to buyer offers — use the form below.", tone: "bg-green-700 text-white" },
  RESERVED: { label: "Reserved", text: "Held for a buyer. Similar lots may be available from this hub.", tone: "bg-accent-dark text-white" },
  SOLD: { label: "Sold", text: "This lot has been sold.", tone: "bg-ink text-cream" },
  TESTED: { label: "Graded", text: "Quality tested — not yet listed for sale.", tone: "bg-cyan-600 text-ink" },
  DRYING: { label: "In processing", text: "Solar drying in progress; quality test to follow.", tone: "bg-amber-500 text-ink" },
  RECEIVED: { label: "In processing", text: "Received at the hub; drying and testing to follow.", tone: "bg-amber-500 text-ink" },
  REJECTED: { label: "Withdrawn", text: "Withdrawn from sale.", tone: "bg-black/60 text-white" },
};

export default async function VerifyLotPage({ params }: Props) {
  const lot = await getPublicLot((await params).lotCode);
  if (!lot) notFound();
  const settings = await getSettings();
  const withdrawn = lot.status === "REJECTED";
  const failed = lot.test?.grade === "FAIL";
  const status = failed && lot.status === "TESTED"
    ? { label: "Not for sale", text: "Did not meet the minimum quality grade.", tone: "bg-red-600 text-white" }
    : STATUS_INFO[lot.status];

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-6">
        {/* Verdict */}
        <section
          className={`-mx-4 px-4 py-6 text-white sm:mx-0 sm:mt-4 sm:rounded-2xl sm:px-6 ${withdrawn ? "bg-ink/80" : "bg-brand"}`}
        >
          <p className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
            <span
              aria-hidden="true"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full text-2xl ${withdrawn ? "bg-white/20" : "bg-white text-brand"}`}
            >
              {withdrawn ? "–" : "✓"}
            </span>
            {withdrawn ? "Lot withdrawn" : "Verified CashewTrace Lot"}
          </p>
          <p className="mt-2 text-sm text-white/85">
            {withdrawn
              ? "This lot is registered with CashewTrace but is not offered for sale."
              : `Received, dried and ${lot.test ? "quality-tested" : "being tested"} at ${lot.hubName}, ${lot.origin.state} State, Nigeria.`}
          </p>
        </section>

        {/* Identity */}
        <section className="mt-4 flex items-stretch gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          {lot.test && (
            <div
              className={`flex w-24 shrink-0 flex-col items-center justify-center rounded-xl py-2 ${GRADE_STYLE[lot.test.grade]}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Grade</span>
              <span className="text-5xl leading-none font-black">{lot.test.grade === "FAIL" ? "✕" : lot.test.grade}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/70">Lot code</p>
            <p className="font-mono text-lg font-bold break-all sm:text-xl">{lot.lotCode}</p>
            <p className="mt-1 text-sm text-ink/70">
              {lot.season} season · harvested {MONTHS[lot.harvestMonth - 1]} {lot.season}
            </p>
            <p className="text-sm text-ink/70">
              {lot.bags} bags · {lot.weightKg >= 1000 ? formatTonnes(lot.weightKg) : formatKg(lot.weightKg)}
            </p>
          </div>
        </section>

        {/* Status */}
        <section className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${status.tone}`}>{status.label}</span>
          <p className="text-sm text-ink/80">{status.text}</p>
        </section>

        {/* Quality */}
        <Panel title="Quality">
          {lot.test ? (
            <QualityPanel test={lot.test} thresholds={settings} />
          ) : (
            <p className="text-sm text-ink/70">The moisture and KOR test has not been recorded yet.</p>
          )}
        </Panel>

        {/* Origin */}
        <Panel title="Origin">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Fact label="Origin" value="Nigeria" />
            <Fact label="State" value={lot.origin.state} />
            <Fact label="LGA" value={lot.origin.lga} />
            <Fact label="Community" value={lot.origin.community} />
            <Fact label="Hub" value={lot.hubName} />
            <Fact label="Farmer" value={lot.origin.farmerInitials} />
            <Fact label="Farm size" value={lot.origin.farmSizeBand} />
          </dl>
          <p className="mt-4 text-xs text-ink/70">
            To protect farmers, CashewTrace shows initials and community only — never names, phone numbers or GPS
            locations. The farmer consented to this information being shown to buyers.
          </p>
        </Panel>

        {/* Chain of custody */}
        <Panel title="Chain of custody">
          <LotTimeline status={lot.status} events={lot.events} />
        </Panel>

        {/* Buyer interest */}
        {lot.status === "LISTED" && !failed && (
          <Panel title="Interested in this lot?" id="interest">
            <InterestForm lotCode={lot.lotCode} hubName={lot.hubName} commissionPct={Math.round(settings.commissionRate * 1000) / 10} />
          </Panel>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Panel({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-4 scroll-mt-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/70">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function QualityPanel({ test, thresholds }: { test: NonNullable<PublicLot["test"]>; thresholds: GradingThresholds }) {
  const drop = test.moistureBefore - test.moistureAfter;
  const scale = Math.max(20, Math.ceil(test.moistureBefore + 2));
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;

  // KOR gauge from 38 to 54 lbs with grade bands from Settings.
  const lo = 38;
  const hi = 54;
  const pos = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  const bands = [
    { from: lo, to: thresholds.gradeC_minKor, cls: "bg-red-200", label: "" },
    { from: thresholds.gradeC_minKor, to: thresholds.gradeB_minKor, cls: "bg-yellow-500", label: "C" },
    { from: thresholds.gradeB_minKor, to: thresholds.gradeA_minKor, cls: "bg-cyan-500", label: "B" },
    { from: thresholds.gradeA_minKor, to: hi, cls: "bg-green-600", label: "A" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Moisture */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold">Moisture</p>
          <p className="text-sm font-semibold text-brand">
            −{drop.toFixed(1)} points with solar drying
          </p>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <MoistureBar label="Before" value={test.moistureBefore} width={pct(test.moistureBefore)} cls="bg-amber-400 text-ink" />
          <MoistureBar label="After" value={test.moistureAfter} width={pct(test.moistureAfter)} cls="bg-brand text-white" />
          <div className="relative ml-14 h-4 text-[11px] text-ink/70">
            <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(thresholds.moistureMaxPct) }}>
              ▲ max {thresholds.moistureMaxPct}%
            </span>
          </div>
        </div>
      </div>

      {/* KOR */}
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
          <p className="font-semibold">Kernel outturn (KOR)</p>
          <p className="text-2xl font-bold whitespace-nowrap text-brand">
            {test.korLbs.toFixed(1)} <span className="text-sm font-medium text-ink/70">lbs / 80 kg</span>
          </p>
        </div>
        <div className="relative mt-3">
          <div className="flex h-3 overflow-hidden rounded-full">
            {bands.map((b) => (
              <div key={b.from} className={b.cls} style={{ width: `${((b.to - b.from) / (hi - lo)) * 100}%` }} />
            ))}
          </div>
          <span
            aria-hidden="true"
            className="absolute -top-1.5 size-6 -translate-x-1/2 rounded-full border-4 border-white bg-ink shadow"
            style={{ left: pos(test.korLbs) }}
          />
          <div className="relative mt-1 h-4 text-[11px] text-ink/70">
            {bands.slice(1).map((b) => (
              <span key={b.label} className="absolute -translate-x-1/2" style={{ left: pos(b.from) }}>
                {b.label} ≥{b.from}
              </span>
            ))}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <Fact label="Nut count" value={test.nutCountPerKg ? `${test.nutCountPerKg} nuts / kg` : "Not recorded"} />
        <Fact label="Defective nuts" value={test.defectivePct !== null ? `${test.defectivePct}%` : "Not recorded"} />
        <Fact label="Drying" value={`${test.dryingMethod} · ${test.dryingDays} days`} />
        <Fact label="Tested on" value={formatDate(test.testedAt)} />
        <Fact label="Tested by" value={`${test.testedBy} (hub agent)`} />
      </dl>
    </div>
  );
}

function MoistureBar({ label, value, width, cls }: { label: string; value: number; width: string; cls: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-ink/70">{label}</span>
      <div className="h-6 flex-1 rounded-md bg-black/5">
        <div className={`flex h-full items-center justify-end rounded-md px-2 text-xs font-bold ${cls}`} style={{ width }}>
          {value}%
        </div>
      </div>
    </div>
  );
}
