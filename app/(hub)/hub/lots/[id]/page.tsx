import type { Sale } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { LotTimeline } from "@/components/LotTimeline";
import { GradeHero, StatusBadge } from "@/components/ui/badges";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { daysSince, formatDate, formatDateTime, MONTHS } from "@/lib/format";
import { REJECTABLE } from "@/lib/lots";
import { formatPhone } from "@/lib/phone";
import { formatKg, formatNaira, toNumber } from "@/lib/money";
import { qrSvg, verifyUrl } from "@/lib/qr";
import { getSettings } from "@/lib/settings";
import { ListForm, QualityTestForm, RejectForm, SaleForm, StartDryingForm } from "./LotForms";

export default async function LotPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const agent = await requireAgent();
  const { id } = await params;
  const { created } = await searchParams;

  const lot = await db.lot.findFirst({
    where: { id, ...hubScope(agent) },
    include: {
      farmer: { select: { id: true, fullName: true, farmerCode: true, community: true, lga: true, state: true } },
      hub: { select: { name: true, code: true } },
      agent: { select: { name: true } },
      qualityTest: { include: { testedBy: { select: { name: true } } } },
      sale: true,
      buyerInterests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lot) notFound();

  const [settings, auditRows] = await Promise.all([
    getSettings(),
    db.auditLog.findMany({
      where: { entity: "Lot", entityId: lot.id },
      orderBy: { createdAt: "asc" },
      include: { agent: { select: { name: true } } },
    }),
  ]);

  const weightKg = toNumber(lot.weightKg);
  const test = lot.qualityTest;
  const graded = test && test.grade !== "FAIL";
  const showQr = graded && ["TESTED", "LISTED", "RESERVED", "SOLD"].includes(lot.status);
  const url = verifyUrl(lot.lotCode);
  const qr = showQr ? await qrSvg(url) : null;
  const dryingDays = lot.dryingStartedAt ? daysSince(lot.dryingStartedAt) : 3;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link href="/hub/lots" className="text-sm font-medium text-brand">
        ← Lots
      </Link>

      {created && (
        <p role="status" className="rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand">
          Lot received as <span className="font-mono">{lot.lotCode}</span>. Next: start solar drying.
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/70">Lot</p>
          <h1 className="font-mono text-xl font-bold break-all sm:text-2xl">{lot.lotCode}</h1>
          <p className="mt-0.5 text-sm text-ink/70">
            <Link href={`/hub/farmers/${lot.farmer.id}`} className="font-medium text-brand underline-offset-2 hover:underline">
              {lot.farmer.fullName}
            </Link>{" "}
            · {lot.farmer.community} · {lot.bags} bags · {formatKg(weightKg)}
          </p>
        </div>
        <StatusBadge status={lot.status} />
      </header>

      {test && <GradeHero grade={test.grade} kor={toNumber(test.korLbs)} />}

      {/* Next step for this lot */}
      {lot.status === "RECEIVED" && (
        <Card title="Next: start solar drying" step="Step 2 of 5">
          <StartDryingForm lotId={lot.id} />
        </Card>
      )}
      {lot.status === "DRYING" && (
        <Card
          title="Next: quality test"
          step="Step 3 of 5"
          note={lot.dryingStartedAt ? `On the solar platform since ${formatDate(lot.dryingStartedAt)} · started at ${toNumber(lot.moistureBefore ?? 0)}% moisture` : undefined}
        >
          <QualityTestForm lotId={lot.id} defaultDryingDays={dryingDays} thresholds={settings} />
        </Card>
      )}
      {lot.status === "TESTED" && graded && (
        <Card title="Next: list for sale" step="Step 4 of 5" note="Listing makes this lot available to buyers. Print bag labels below first.">
          <ListForm lotId={lot.id} />
        </Card>
      )}
      {lot.status === "TESTED" && !graded && (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
          <strong>Cannot be listed.</strong> KOR is below the {settings.gradeC_minKor} lbs minimum. Return the nuts to
          the farmer and record the rejection below.
        </p>
      )}
      {(lot.status === "LISTED" || lot.status === "RESERVED") && (
        <Card title="Next: record sale" step="Step 5 of 5">
          <SaleForm
            lotId={lot.id}
            weightKg={weightKg}
            bags={lot.bags}
            defaultPrice={settings.farmGatePricePerTonneNgn}
            fees={settings}
          />
        </Card>
      )}
      {lot.sale && <PayoutCard sale={lot.sale} bags={lot.bags} weightKg={weightKg} />}
      {lot.status === "REJECTED" && (
        <section className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200">
          <h2 className="font-bold text-red-900">Lot rejected</h2>
          <p className="mt-1 text-sm text-red-900">{lot.rejectionReason ?? "No reason recorded."}</p>
        </section>
      )}
      {REJECTABLE.includes(lot.status) && <RejectForm lotId={lot.id} open={lot.status === "TESTED" && !graded} />}

      {/* QR tag */}
      {qr && (
        <Card title="QR tag">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="w-40 shrink-0 rounded-xl bg-white p-2 ring-1 ring-black/10 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="flex w-full min-w-0 flex-col gap-3">
              <p className="text-sm text-ink/70">
                Buyers scan this to verify origin and quality:
                <a href={url} target="_blank" rel="noopener" className="mt-1 block font-mono text-xs break-all text-brand underline">{url}</a>
              </p>
              <Link
                href={`/hub/lots/${lot.id}/labels?per=1`}
                className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-cream"
              >
                Print bag labels · {lot.bags}
              </Link>
              <Link
                href={`/hub/lots/${lot.id}/labels?per=2`}
                className="flex h-12 items-center justify-center rounded-xl bg-white text-sm font-semibold text-ink ring-1 ring-black/15"
              >
                Print 2 labels per bag · {lot.bags * 2}
              </Link>
            </div>
          </div>
        </Card>
      )}

      {lot.buyerInterests.length > 0 && (
        <Card title={`Buyer enquiries (${lot.buyerInterests.length})`} note="Sent from the public verification page.">
          <ul className="flex flex-col divide-y divide-black/5">
            {lot.buyerInterests.map((b) => (
              <li key={b.id} className="py-3 first:pt-0 last:pb-0">
                <p className="font-semibold">
                  {b.companyName} <span className="font-normal text-ink/70">· {b.contactName}</span>
                  {b.contactedAt ? (
                    <span className="ml-2 rounded bg-brand-light px-1.5 py-0.5 text-xs font-semibold text-brand">✓ Contacted</span>
                  ) : (
                    <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent-darker">New</span>
                  )}
                </p>
                <p className="text-sm">
                  <a href={`mailto:${b.email}`} className="text-brand underline-offset-2 hover:underline">{b.email}</a>
                  {" · "}
                  <a href={`tel:${b.phone.replace(/[^+d]/g, "")}`} className="text-brand underline-offset-2 hover:underline">{formatPhone(b.phone)}</a>
                </p>
                {b.message && <p className="mt-1 text-sm text-ink/80">“{b.message}”</p>}
                <p className="mt-0.5 text-xs text-ink/70">{formatDateTime(b.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Timeline">
        <LotTimeline
          status={lot.status}
          events={auditRows.map((a) => ({ id: a.id, action: a.action, detail: a.detail, createdAt: a.createdAt, agentName: a.agent.name }))}
        />
      </Card>

      {test && (
        <Card title="Quality results">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <Detail label="Moisture" value={`${toNumber(test.moistureBefore)}% → ${toNumber(test.moistureAfter)}%`} />
            <Detail label="KOR" value={`${toNumber(test.korLbs).toFixed(1)} lbs / 80 kg`} />
            <Detail label="Nut count" value={test.nutCountPerKg ? `${test.nutCountPerKg} / kg` : "n/a"} />
            <Detail label="Defective" value={test.defectivePct !== null ? `${toNumber(test.defectivePct)}%` : "n/a"} />
            <Detail label="Drying" value={`${test.dryingDays} days · solar platform`} />
            <Detail label="Tested" value={`${formatDateTime(test.testedAt)} · ${test.testedBy.name}`} />
          </dl>
        </Card>
      )}

      <Card title="Lot details">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Detail label="Farmer" value={`${lot.farmer.fullName} (${lot.farmer.farmerCode})`} />
          <Detail label="Origin" value={`${lot.farmer.community}, ${lot.farmer.lga} LGA, ${lot.farmer.state}`} />
          <Detail label="Hub" value={`${lot.hub.name} (${lot.hub.code})`} />
          <Detail label="Harvest" value={`${MONTHS[lot.harvestMonth - 1]} · ${lot.season} season`} />
          <Detail label="Bags / weight" value={`${lot.bags} bags · ${formatKg(weightKg)}`} />
          <Detail label="Average per bag" value={formatKg(weightKg / lot.bags)} />
          <Detail label="Received" value={`${formatDateTime(lot.receivedAt)} · ${lot.agent.name}`} />
        </dl>
      </Card>
    </div>
  );
}

function Card({ title, step, note, children }: { title: string; step?: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      {step && <p className="text-xs font-semibold uppercase tracking-wider text-accent-dark">{step}</p>}
      <h2 className="text-lg font-bold">{title}</h2>
      {note && <p className="mt-0.5 text-sm text-ink/70">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink/70">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function PayoutCard({
  sale,
  bags,
  weightKg,
}: {
  sale: Sale;
  bags: number;
  weightKg: number;
}) {
  const total = toNumber(sale.totalValueNgn);
  const commission = toNumber(sale.commissionNgn);
  const rate = total > 0 ? Math.round((commission / total) * 1000) / 10 : 0;
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
      <div className="bg-brand p-5 text-cream">
        <p className="text-sm text-cream/80">Farmer payout</p>
        <p className="text-3xl font-bold">{formatNaira(toNumber(sale.farmerPayoutNgn))}</p>
        <p className="mt-1 text-sm text-cream/80">
          Sold to {sale.buyerName} on {formatDate(sale.soldAt)}
        </p>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 p-5 text-sm">
        <dt className="text-ink/70">
          Price × weight <span className="text-xs">({formatNaira(toNumber(sale.pricePerTonneNgn))}/t × {formatKg(weightKg)})</span>
        </dt>
        <dd className="text-right font-medium">{formatNaira(total)}</dd>
        <dt className="text-ink/70">Drying &amp; testing fees ({bags} bags)</dt>
        <dd className="text-right font-medium">− {formatNaira(toNumber(sale.farmerFeesNgn))}</dd>
        <dt className="border-t border-black/10 pt-2 font-semibold">Paid to farmer</dt>
        <dd className="border-t border-black/10 pt-2 text-right font-bold text-brand">{formatNaira(toNumber(sale.farmerPayoutNgn))}</dd>
        <dt className="pt-3 text-ink/70">CashewTrace commission ({rate}%, paid by buyer)</dt>
        <dd className="pt-3 text-right font-medium">{formatNaira(commission)}</dd>
        <dt className="text-ink/70">Buyer pays in total</dt>
        <dd className="text-right font-medium">{formatNaira(total + commission)}</dd>
      </dl>
    </section>
  );
}
