import type { Grade } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, GradeBadge, StatusBadge } from "@/components/ui/badges";
import { PrintButton } from "@/components/ui/PrintButton";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, MONTHS } from "@/lib/format";
import { formatKg, formatNaira, formatTonnes, toNumber } from "@/lib/money";
import { formatPhone } from "@/lib/phone";

export default async function FarmerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const agent = await requireAgent();
  const { id } = await params;
  const { created } = await searchParams;

  const farmer = await db.farmer.findFirst({
    where: { id, ...hubScope(agent) },
    include: {
      hub: { select: { name: true, code: true } },
      lots: {
        orderBy: { receivedAt: "desc" },
        include: { qualityTest: true, sale: true },
      },
    },
  });
  if (!farmer) notFound();

  const lots = farmer.lots.map((l) => ({
    ...l,
    weightKg: toNumber(l.weightKg),
    kor: l.qualityTest ? toNumber(l.qualityTest.korLbs) : null,
    moisture: l.qualityTest ? toNumber(l.qualityTest.moistureAfter) : null,
  }));
  const totalKg = lots.reduce((s, l) => s + l.weightKg, 0);
  const tested = lots.filter((l) => l.kor !== null);
  const avgKor = tested.length ? tested.reduce((s, l) => s + l.kor!, 0) / tested.length : null;
  const sold = lots.filter((l) => l.sale).sort((a, b) => a.sale!.soldAt.getTime() - b.sale!.soldAt.getTime());
  const sumSales = (key: "farmerPayoutNgn" | "totalValueNgn" | "farmerFeesNgn") =>
    sold.reduce((acc, l) => acc + toNumber(l.sale![key]), 0);
  const totalPayout = sumSales("farmerPayoutNgn");
  const totalValue = sumSales("totalValueNgn");
  const totalFees = sumSales("farmerFeesNgn");
  const soldKg = sold.reduce((s, l) => s + l.weightKg, 0);
  const seasons = [...new Set(lots.map((l) => l.season))].sort();
  const grades = tested.reduce<Partial<Record<Grade, number>>>((acc, l) => {
    const g = l.qualityTest!.grade;
    return { ...acc, [g]: (acc[g] ?? 0) + 1 };
  }, {});

  const location = `${farmer.community}, ${farmer.lga} LGA, ${farmer.state} State`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden">
        <Link href="/hub/farmers" className="mb-3 inline-block text-sm font-medium text-brand">
          ← Farmers
        </Link>

        {created && (
          <p role="status" className="mb-4 rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand">
            Farmer registered as <span className="font-mono">{farmer.farmerCode}</span>.
          </p>
        )}

        {/* Profile */}
        <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <div className="flex items-center gap-4">
            <Avatar name={farmer.fullName} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{farmer.fullName}</h1>
              <p className="font-mono text-sm text-ink/70">{farmer.farmerCode}</p>
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Detail label="Community" value={location} wide />
            <Detail label="Phone" value={formatPhone(farmer.phone)} />
            <Detail label="Gender" value={farmer.gender === "FEMALE" ? "Female" : "Male"} />
            <Detail label="Age group" value={farmer.ageGroup === "YOUTH_18_35" ? "Youth (18–35)" : "36 and over"} />
            <Detail label="Farm size" value={`${toNumber(farmer.farmSizeHa)} ha`} />
            <Detail label="Cashew trees" value={farmer.numberOfTrees?.toLocaleString("en-NG") ?? "n/a"} />
            <Detail label="Cooperative" value={farmer.cooperative ?? "n/a"} />
            <Detail label="Hub" value={`${farmer.hub.name} (${farmer.hub.code})`} />
            <Detail label="Registered" value={formatDate(farmer.createdAt)} />
            <Detail label="Buyer data consent" value={farmer.consentGiven ? "Given ✓" : "Not given"} />
          </dl>
        </section>

        {/* Stats */}
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Lots delivered" value={String(lots.length)} />
          <Stat label="Total delivered" value={totalKg >= 1000 ? formatTonnes(totalKg) : formatKg(totalKg)} sub={totalKg >= 1000 ? formatKg(totalKg) : undefined} />
          <Stat label="Average KOR" value={avgKor !== null ? `${avgKor.toFixed(1)} lbs` : "n/a"} sub={tested.length ? `${tested.length} tested lots` : "No tests yet"} />
          <Stat label="Total payout" value={formatNaira(totalPayout)} sub={`${sold.length} sold lots`} />
        </section>

        <div className="mt-4">
          <Link
            href={`/hub/lots/new?farmerId=${farmer.id}`}
            className="flex h-12 items-center justify-center rounded-xl bg-accent-dark text-base font-semibold text-white transition hover:bg-accent-darker"
          >
            + Record a new lot for this farmer
          </Link>
        </div>

        {/* Lots */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Lots</h2>
          {lots.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink/70 ring-1 ring-black/5">No lots yet.</p>
          ) : (
            <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
              {lots.map((l) => (
                <li key={l.id}>
                  <Link href={`/hub/lots/${l.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-4 py-3 transition hover:bg-cream active:bg-cream">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{l.lotCode}</p>
                    <p className="text-xs text-ink/70">
                      {MONTHS[l.harvestMonth - 1]} {l.season} harvest · {l.bags} bags · {formatKg(l.weightKg)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.kor !== null && <span className="text-xs text-ink/70">KOR {l.kor.toFixed(1)}</span>}
                    {l.qualityTest && <GradeBadge grade={l.qualityTest.grade} />}
                    <StatusBadge status={l.status} />
                  </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-10 mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Farmer sales record</h2>
            <p className="text-sm text-ink/70">Printable summary the farmer can show a microfinance bank.</p>
          </div>
          <PrintButton label="Print record" />
        </div>
      </div>

      {/* Printable sales record */}
      <article className="rounded-2xl bg-white p-6 ring-1 ring-black/5 print:rounded-none print:p-0 print:ring-0">
        <header className="flex items-start justify-between gap-4 border-b-2 border-brand pb-4">
          <div>
            <p className="text-xl font-bold text-brand">
              Cashew<span className="text-accent-dark">Trace</span>
            </p>
            <p className="text-sm font-semibold uppercase tracking-wider">Farmer sales record</p>
          </div>
          <div className="text-right text-xs text-ink/70">
            <p>Issued {formatDate(new Date())}</p>
            <p>
              {farmer.hub.name} ({farmer.hub.code})
            </p>
          </div>
        </header>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Detail label="Farmer" value={farmer.fullName} />
          <Detail label="Farmer code" value={farmer.farmerCode} />
          <Detail label="Location" value={location} />
          <Detail label="Phone" value={formatPhone(farmer.phone)} />
          <Detail label="Farm size" value={`${toNumber(farmer.farmSizeHa)} ha${farmer.numberOfTrees ? ` · ${farmer.numberOfTrees.toLocaleString("en-NG")} trees` : ""}`} />
          <Detail label="Registered since" value={formatDate(farmer.createdAt)} />
          {farmer.cooperative && <Detail label="Cooperative" value={farmer.cooperative} />}
          <Detail label="Seasons active" value={seasons.length ? seasons.join(", ") : "n/a"} />
        </dl>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          <RecordStat label="Lots delivered" value={`${lots.length}`} sub={formatKg(totalKg)} />
          <RecordStat label="Lots sold" value={`${sold.length}`} sub={formatKg(soldKg)} />
          <RecordStat label="Gross sales" value={formatNaira(totalValue)} sub={`less fees ${formatNaira(totalFees)}`} />
          <RecordStat label="Paid to farmer" value={formatNaira(totalPayout)} highlight />
        </div>

        <p className="mt-3 text-xs text-ink/70">
          Quality: average KOR {avgKor !== null ? `${avgKor.toFixed(1)} lbs/80 kg bag` : "n/a"}
          {Object.keys(grades).length > 0 &&
            ` · grades ${(["A", "B", "C", "FAIL"] as Grade[])
              .filter((g) => grades[g])
              .map((g) => `${g === "FAIL" ? "fail" : g} ×${grades[g]}`)
              .join(", ")}`}
        </p>

        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Sales table (scrolls sideways)">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-xs uppercase tracking-wide text-ink/70">
                <th className="py-2 pr-2 font-semibold">Sold</th>
                <th className="py-2 pr-2 font-semibold">Lot</th>
                <th className="py-2 pr-2 text-right font-semibold">Weight</th>
                <th className="py-2 pr-2 font-semibold">Grade</th>
                <th className="py-2 pr-2 text-right font-semibold">₦ / tonne</th>
                <th className="py-2 text-right font-semibold">Paid to farmer</th>
              </tr>
            </thead>
            <tbody>
              {sold.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-ink/70">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sold.map((l) => (
                  <tr key={l.id} className="border-b border-black/5">
                    <td className="py-2 pr-2 whitespace-nowrap">{formatDate(l.sale!.soldAt)}</td>
                    <td className="py-2 pr-2 font-mono text-xs">{l.lotCode}</td>
                    <td className="py-2 pr-2 text-right whitespace-nowrap">{formatKg(l.weightKg)}</td>
                    <td className="py-2 pr-2">{l.qualityTest?.grade ?? "n/a"}</td>
                    <td className="py-2 pr-2 text-right">{formatNaira(toNumber(l.sale!.pricePerTonneNgn))}</td>
                    <td className="py-2 text-right font-semibold">{formatNaira(toNumber(l.sale!.farmerPayoutNgn))}</td>
                  </tr>
                ))
              )}
            </tbody>
            {sold.length > 0 && (
              <tfoot>
                <tr className="font-bold">
                  <td className="pt-2" colSpan={2}>
                    Total
                  </td>
                  <td className="pt-2 pr-2 text-right whitespace-nowrap">{formatKg(soldKg)}</td>
                  <td colSpan={2} />
                  <td className="pt-2 text-right">{formatNaira(totalPayout)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <footer className="mt-6 border-t border-black/10 pt-3 text-xs leading-relaxed text-ink/70">
          <p>
            Weights and quality results are recorded by the hub at intake and testing. Payouts are sale value
            less drying and testing fees. Lot codes can be verified by scanning the lot QR code.
          </p>
          <p className="mt-1 font-semibold text-ink/80">
            Prototype · demo data. Fictional record, not a financial document.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : undefined}>
      <dt className="text-xs text-ink/70">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <p className="text-xs text-ink/70">{label}</p>
      <p className="mt-1 text-xl font-bold text-brand">{value}</p>
      {sub && <p className="text-xs text-ink/70">{sub}</p>}
    </div>
  );
}

function RecordStat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-brand text-cream" : "bg-cream"} print:border print:border-black/20`}>
      <p className={`text-xs ${highlight ? "text-cream/80" : "text-ink/70"}`}>{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
      {sub && <p className={`text-xs ${highlight ? "text-cream/80" : "text-ink/70"}`}>{sub}</p>}
    </div>
  );
}
