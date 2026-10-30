import Link from "next/link";
import { notFound } from "next/navigation";
import { GRADE_STYLE } from "@/components/ui/badges";
import { PrintButton } from "@/components/ui/PrintButton";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatKg, toNumber } from "@/lib/money";
import { qrSvg, verifyUrl } from "@/lib/qr";

const MAX_LABELS = 400;

// One A6 (105 × 148 mm) label per printed page.
const PRINT_CSS = `
@page { size: 105mm 148mm; margin: 0; }
@media print {
  .label-grid { display: block !important; }
  .bag-label { width: 105mm !important; height: 148mm !important; max-width: none !important;
    margin: 0 !important; border: 0 !important; border-radius: 0 !important; break-after: page; }
}`;

export default async function LabelsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ per?: string }>;
}) {
  const agent = await requireAgent();
  const { id } = await params;
  const per = (await searchParams).per === "2" ? 2 : 1;

  const lot = await db.lot.findFirst({
    where: { id, ...hubScope(agent) },
    include: { hub: { select: { name: true, code: true } }, qualityTest: { select: { grade: true, korLbs: true } } },
  });
  // Labels carry a grade, so only graded (A/B/C) lots get them.
  if (!lot || !lot.qualityTest || lot.qualityTest.grade === "FAIL") notFound();

  const { grade, korLbs } = lot.qualityTest;
  const url = verifyUrl(lot.lotCode);
  const qr = await qrSvg(url);
  const weight = formatKg(toNumber(lot.weightKg));
  const total = Math.min(lot.bags * per, MAX_LABELS);
  const labels = Array.from({ length: total }, (_, i) => ({ bag: Math.floor(i / per) + 1, copy: (i % per) + 1 }));

  return (
    <div className="mx-auto max-w-5xl">
      <style>{PRINT_CSS}</style>

      <div className="mb-5 flex flex-col gap-3 print:hidden">
        <Link href={`/hub/lots/${lot.id}`} className="text-sm font-medium text-brand">
          ← {lot.lotCode}
        </Link>
        <h1 className="text-2xl font-bold">Bag labels</h1>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2].map((n) => (
            <Link
              key={n}
              href={`/hub/lots/${lot.id}/labels?per=${n}`}
              aria-current={per === n ? "true" : undefined}
              className={`flex h-11 items-center rounded-full px-4 text-sm font-medium ${
                per === n ? "bg-brand text-cream" : "bg-white ring-1 ring-black/10"
              }`}
            >
              {n === 1 ? "1 label per bag" : "2 labels per bag"}
            </Link>
          ))}
          <PrintButton label={`Print ${total} labels`} />
        </div>
        <p className="text-sm text-ink/70">
          A6 (105 × 148 mm), one label per page. {lot.bags} bags × {per} = {lot.bags * per} labels
          {lot.bags * per > MAX_LABELS && ` (capped at ${MAX_LABELS})`}. Tip: with 2 per bag, put one inside the bag and
          stitch one outside.
        </p>
      </div>

      <div className="label-grid grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map(({ bag, copy }) => (
          <article
            key={`${bag}-${copy}`}
            className="bag-label flex aspect-[105/148] w-full max-w-[105mm] flex-col rounded-xl border border-black/20 bg-white p-[6mm] text-ink"
          >
            <header className="flex items-baseline justify-between border-b-2 border-brand pb-[2mm]">
              <span className="text-[6mm] font-bold leading-none text-brand">
                Cashew<span className="text-accent-dark">Trace</span>
              </span>
              <span className="text-[2.6mm] font-semibold uppercase tracking-wider">Raw cashew nuts</span>
            </header>

            <p className="mt-[2.5mm] text-center font-mono text-[4.6mm] font-bold tracking-tight">{lot.lotCode}</p>

            <div className="mt-[2mm] flex items-stretch gap-[3mm]">
              <div className={`flex w-[24mm] shrink-0 flex-col items-center justify-center rounded-[2mm] ${GRADE_STYLE[grade]}`}>
                <span className="text-[2.6mm] font-semibold uppercase">Grade</span>
                <span className="text-[13mm] leading-none font-black">{grade}</span>
              </div>
              <dl className="grid flex-1 grid-cols-2 gap-x-[2mm] gap-y-[1.2mm] text-[2.8mm] leading-tight">
                <div>
                  <dt className="text-ink/70">Season</dt>
                  <dd className="font-semibold">{lot.season}</dd>
                </div>
                <div>
                  <dt className="text-ink/70">KOR</dt>
                  <dd className="font-semibold">{toNumber(korLbs).toFixed(1)} lbs</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink/70">Hub</dt>
                  <dd className="font-semibold">
                    {lot.hub.name} ({lot.hub.code})
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-ink/70">Lot weight</dt>
                  <dd className="font-semibold">
                    {weight} · {lot.bags} bags
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-auto flex flex-col items-center">
              <div className="w-[62mm] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <p className="mt-[1.5mm] text-[4.2mm] font-bold tracking-wide">Scan to verify</p>
              <p className="max-w-full truncate font-mono text-[2.3mm] text-ink/70">{url}</p>
            </div>

            <footer className="mt-[2mm] flex justify-between border-t border-black/15 pt-[1.5mm] text-[2.4mm] text-ink/70">
              <span>
                Bag {bag} of {lot.bags}
                {per === 2 && ` · copy ${copy}/2`}
              </span>
              <span>Prototype · demo data</span>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
