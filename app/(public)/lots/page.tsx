import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/public/SiteChrome";
import { GRADE_STYLE } from "@/components/ui/badges";
import { formatTonnes } from "@/lib/money";
import { getCatalogueSummary, getListedLots, type CatalogueFilters, type CatalogueLot } from "@/lib/public-lot";

export const metadata: Metadata = {
  title: "Available cashew lots · CashewTrace",
  description:
    "Quality-tested, solar-dried raw cashew nut lots from Nigerian village hubs. Filter by grade, KOR, season and state, then verify each lot. Prototype · demo data.",
  openGraph: { title: "Available cashew lots · CashewTrace", url: "/lots", siteName: "CashewTrace", type: "website" },
};

type Search = { grade?: string; season?: string; state?: string; minKor?: string; sort?: string };

function parseFilters(sp: Search): CatalogueFilters {
  const minKor = Number(sp.minKor);
  const season = Number(sp.season);
  return {
    grade: sp.grade === "A" || sp.grade === "B" || sp.grade === "C" ? sp.grade : undefined,
    season: Number.isInteger(season) && season >= 2000 ? season : undefined,
    state: sp.state?.trim() ? sp.state.trim().slice(0, 40) : undefined,
    minKor: Number.isFinite(minKor) && minKor > 0 && minKor <= 70 ? minKor : undefined,
    sort: sp.sort === "weight" ? "weight" : "kor",
  };
}

const selectClass =
  "h-12 w-full rounded-xl border border-black/15 bg-white px-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/40";

export default async function CataloguePage({ searchParams }: { searchParams: Promise<Search> }) {
  const filters = parseFilters(await searchParams);
  const [lots, summary] = await Promise.all([getListedLots(filters), getCatalogueSummary()]);
  const filtered = Boolean(filters.grade || filters.season || filters.state || filters.minKor);
  const shownKg = lots.reduce((s, l) => s + l.weightKg, 0);

  return (
    <>
      <SiteHeader wide />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <h1 className="text-3xl font-bold text-brand">Available cashew lots</h1>
        <p className="mt-1 max-w-2xl text-ink/70">
          Raw cashew nuts dried on solar platforms and tested for moisture and KOR at CashewTrace village hubs. Every lot
          links to its verification record.
        </p>

        {/* Summary strip — everything currently available */}
        <section aria-label="Availability summary" className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          <div className="col-span-3 rounded-2xl bg-brand p-4 text-cream sm:col-span-1">
            <p className="text-sm text-cream/80">Available now</p>
            <p className="text-3xl font-bold">{formatTonnes(summary.totalKg)}</p>
            <p className="text-sm text-cream/80">
              {summary.lotCount} lots{summary.avgKor !== null && ` · avg KOR ${summary.avgKor.toFixed(1)}`}
            </p>
          </div>
          {(["A", "B", "C"] as const).map((g) => (
            <Link
              key={g}
              href={`/lots?grade=${g}`}
              className="flex flex-col items-start gap-2 rounded-2xl bg-white p-3 ring-1 ring-black/5 transition hover:ring-brand/40 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xl font-black ${GRADE_STYLE[g]}`}>{g}</span>
              <span>
                <span className="block text-lg font-bold">{formatTonnes(summary.byGrade[g].kg)}</span>
                <span className="block text-xs text-ink/70">
                  {summary.byGrade[g].lots} lot{summary.byGrade[g].lots === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          ))}
        </section>

        {/* Filters — plain GET form, works without JavaScript */}
        <form action="/lots" className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 md:grid-cols-6 md:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/70">Grade</span>
            <select name="grade" defaultValue={filters.grade ?? ""} className={selectClass}>
              <option value="">All grades</option>
              <option value="A">Grade A</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/70">Season</span>
            <select name="season" defaultValue={filters.season ? String(filters.season) : ""} className={selectClass}>
              <option value="">All seasons</option>
              {summary.seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/70">State</span>
            <select name="state" defaultValue={filters.state ?? ""} className={selectClass}>
              <option value="">All states</option>
              {summary.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/70">Min KOR (lbs)</span>
            <input
              name="minKor"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              max="70"
              placeholder="e.g. 47"
              defaultValue={filters.minKor}
              className={selectClass}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1 md:col-span-1">
            <span className="text-xs font-semibold text-ink/70">Sort by</span>
            <select name="sort" defaultValue={filters.sort} className={selectClass}>
              <option value="kor">Highest KOR</option>
              <option value="weight">Largest weight</option>
            </select>
          </label>
          <div className="col-span-2 flex gap-2 md:col-span-1">
            <button type="submit" className="h-12 flex-1 rounded-xl bg-brand text-sm font-semibold text-cream transition hover:bg-brand-dark">
              Apply
            </button>
            {filtered && (
              <Link href="/lots" className="flex h-12 items-center rounded-xl px-3 text-sm font-medium text-brand ring-1 ring-brand/30">
                Reset
              </Link>
            )}
          </div>
        </form>

        <p className="mt-4 text-sm text-ink/70" aria-live="polite">
          {filtered ? "Matching: " : "Showing all: "}
          <strong>
            {lots.length} lot{lots.length === 1 ? "" : "s"} · {formatTonnes(shownKg)}
          </strong>
          {" · "}sorted by {filters.sort === "weight" ? "largest weight" : "highest KOR"}
        </p>

        {lots.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-10 text-center ring-1 ring-black/5">
            <p className="font-semibold">No lots match these filters</p>
            <Link href="/lots" className="mt-2 inline-block text-sm font-medium text-brand underline">
              Show all available lots
            </Link>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <LotCard key={lot.lotCode} lot={lot} />
            ))}
          </ul>
        )}

        <p className="mt-8 rounded-2xl border border-dashed border-black/20 p-4 text-sm text-ink/70">
          <strong className="text-ink">No prices are listed.</strong> Prices are negotiated with the hub for each lot.
          Use “Request this lot” to send your enquiry; the hub will reply with a sample, price and pickup details.
        </p>
      </main>
      <SiteFooter wide />
    </>
  );
}

function LotCard({ lot }: { lot: CatalogueLot }) {
  return (
    <li className="flex flex-col rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <div className="flex items-start gap-3">
        <span className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-xl ${GRADE_STYLE[lot.grade]}`}>
          <span className="text-[10px] font-semibold uppercase leading-none">Grade</span>
          <span className="text-2xl leading-none font-black">{lot.grade}</span>
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-bold">{lot.lotCode}</p>
          <p className="text-sm text-ink/70">
            {lot.lga} LGA, {lot.state} State
          </p>
          <p className="text-xs text-ink/70">{lot.season} season · solar dried</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-cream p-3 text-center">
        <div>
          <dt className="text-[11px] text-ink/70">KOR</dt>
          <dd className="text-lg font-bold text-brand">{lot.korLbs.toFixed(1)}</dd>
          <dd className="text-[10px] text-ink/70">lbs/80 kg</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink/70">Moisture</dt>
          <dd className="text-lg font-bold">{lot.moistureAfter}%</dd>
        </div>
        <div>
          <dt className="text-[11px] text-ink/70">Weight</dt>
          <dd className="text-lg font-bold">{formatTonnes(lot.weightKg, 2)}</dd>
          <dd className="text-[10px] text-ink/70">{lot.bags} bags</dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={`/v/${lot.lotCode}`}
          className="flex h-11 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-cream transition hover:bg-brand-dark"
        >
          View &amp; verify
        </Link>
        <Link
          href={`/v/${lot.lotCode}#interest`}
          className="flex h-11 items-center justify-center rounded-xl text-sm font-semibold text-accent-dark ring-1 ring-accent/50 transition hover:bg-accent/10"
        >
          Request this lot
        </Link>
      </div>
    </li>
  );
}
