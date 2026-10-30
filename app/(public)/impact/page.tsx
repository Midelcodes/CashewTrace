import type { Metadata } from "next";
import { ImpactView } from "@/components/impact/ImpactView";
import { SiteFooter, SiteHeader } from "@/components/public/SiteChrome";
import { FilterChips } from "@/components/ui/FilterChips";
import { lagosToday } from "@/lib/format";
import { getImpact, impactSeasons } from "@/lib/impact";

export const metadata: Metadata = {
  title: "Impact · CashewTrace",
  description:
    "Aggregate impact of CashewTrace village quality hubs: farmers reached, tonnes dried and tested, quality, farmer payouts and estimated losses avoided. Prototype · demo data.",
  openGraph: { title: "CashewTrace impact", url: "/impact", siteName: "CashewTrace", type: "website" },
};

// Public, read-only: aggregate KPIs and charts across all hubs. No tables, names or per-lot rows.
export default async function PublicImpactPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const sp = await searchParams;
  const current = lagosToday().year;
  const seasons = await impactSeasons(undefined, current);
  const season = sp.season === "all" ? undefined : seasons.includes(Number(sp.season)) ? Number(sp.season) : current;
  const periodLabel = season ? `${season} season` : "all seasons";
  const impact = await getImpact({ season });

  return (
    <>
      <SiteHeader wide />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-3xl font-bold text-brand">CashewTrace impact</h1>
          <p className="mt-1 max-w-2xl text-ink/70">
            What the village quality hubs have done for cashew farmers — {periodLabel}, all hubs. Figures are computed
            from the prototype’s demo data; anything estimated is labelled.
          </p>
        </div>
        <FilterChips
          label="Season"
          options={[...seasons.map((s) => ({ value: String(s), label: String(s) })), { value: "all", label: "All seasons" }]}
          active={season ? String(season) : "all"}
          href={(v) => (v === String(current) ? "/impact" : `/impact?season=${v}`)}
        />
        <ImpactView data={impact} periodLabel={periodLabel} />
      </main>
      <SiteFooter wide />
    </>
  );
}
