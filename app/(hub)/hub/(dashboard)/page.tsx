import Link from "next/link";
import { ImpactView } from "@/components/impact/ImpactView";
import { GradeBadge, StatusBadge } from "@/components/ui/badges";
import { FilterChips } from "@/components/ui/FilterChips";
import { requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime, lagosToday } from "@/lib/format";
import { getImpact, impactSeasons } from "@/lib/impact";
import { formatPhone } from "@/lib/phone";
import { formatKg, toNumber } from "@/lib/money";
import { toggleContactedAction } from "../actions";

type Search = { season?: string; hub?: string };

export default async function HubDashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const agent = await requireAgent();
  const sp = await searchParams;
  const isAdmin = agent.role === "ADMIN";
  const current = lagosToday().year;

  // Admins pick a hub (default: all); agents are pinned to their own hub.
  const hubs = isAdmin ? await db.hub.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }) : [];
  const selectedHub = isAdmin ? hubs.find((h) => h.code === sp.hub) : undefined;
  const hubId = isAdmin ? selectedHub?.id : agent.hubId;
  const hubLabel = isAdmin ? (selectedHub?.name ?? "All hubs") : agent.hub.name;

  const seasons = await impactSeasons(hubId, current);
  const season = sp.season === "all" ? undefined : seasons.includes(Number(sp.season)) ? Number(sp.season) : current;
  const periodLabel = season ? `${season} season` : "all seasons";

  const lotScope = { ...(hubId && { hubId }), ...(season && { season }) };
  const [impact, latestLots, interests] = await Promise.all([
    getImpact({ hubId, season }),
    db.lot.findMany({
      where: lotScope,
      orderBy: { receivedAt: "desc" },
      take: 10,
      select: {
        id: true,
        lotCode: true,
        bags: true,
        weightKg: true,
        status: true,
        receivedAt: true,
        farmer: { select: { fullName: true } },
        qualityTest: { select: { grade: true } },
      },
    }),
    db.buyerInterest.findMany({
      where: hubId ? { lot: { hubId } } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { lot: { select: { id: true, lotCode: true } } },
    }),
  ]);

  const href = (patch: Search) => {
    const params = new URLSearchParams();
    const next = { season: sp.season, hub: sp.hub, ...patch };
    if (next.season) params.set("season", next.season);
    if (next.hub) params.set("hub", next.hub);
    const qs = params.toString();
    return qs ? `/hub?${qs}` : "/hub";
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Impact dashboard</h1>
        <p className="text-sm text-ink/70">
          {hubLabel} · {periodLabel}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {isAdmin && (
          <FilterChips
            label="Hub"
            options={[{ value: "", label: "All hubs" }, ...hubs.map((h) => ({ value: h.code, label: h.name.replace(" Quality Hub", "") }))]}
            active={selectedHub?.code ?? ""}
            href={(v) => href({ hub: v || undefined })}
          />
        )}
        <FilterChips
          label="Season"
          options={[...seasons.map((s) => ({ value: String(s), label: String(s) })), { value: "all", label: "All seasons" }]}
          active={season ? String(season) : "all"}
          href={(v) => href({ season: v === String(current) ? undefined : v })}
        />
      </div>

      <ImpactView data={impact} periodLabel={periodLabel} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Latest lots</h2>
            <Link href="/hub/lots" className="text-sm font-medium text-brand">
              All lots →
            </Link>
          </div>
          {latestLots.length === 0 ? (
            <p className="text-sm text-ink/70">No lots in {periodLabel}.</p>
          ) : (
            <ul className="-mx-2 divide-y divide-black/5">
              {latestLots.map((l) => (
                <li key={l.id}>
                  <Link href={`/hub/lots/${l.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-cream">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs font-semibold">{l.lotCode}</p>
                      <p className="truncate text-sm">
                        {l.farmer.fullName} <span className="text-ink/70">· {formatKg(toNumber(l.weightKg))}</span>
                      </p>
                      <p className="text-xs text-ink/70">{formatDate(l.receivedAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {l.qualityTest && <GradeBadge grade={l.qualityTest.grade} />}
                      <StatusBadge status={l.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-black/5 sm:p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-bold">Latest buyer enquiries</h2>
            <span className="text-xs text-ink/70">{interests.filter((i) => !i.contactedAt).length} awaiting contact</span>
          </div>
          {interests.length === 0 ? (
            <p className="text-sm text-ink/70">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-black/5">
              {interests.map((b) => (
                <li key={b.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.companyName}</p>
                    <p className="truncate text-sm text-ink/70">
                      {b.contactName} ·{" "}
                      <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`} className="text-brand underline underline-offset-2">
                        {formatPhone(b.phone)}
                      </a>
                    </p>
                    <p className="truncate text-xs text-ink/70">
                      <Link href={`/hub/lots/${b.lot.id}`} className="font-mono underline-offset-2 hover:underline">
                        {b.lot.lotCode}
                      </Link>{" "}
                      · {formatDateTime(b.createdAt)}
                    </p>
                  </div>
                  <form action={toggleContactedAction}>
                    <input type="hidden" name="interestId" value={b.id} />
                    <button
                      type="submit"
                      aria-pressed={!!b.contactedAt}
                      className={`flex h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition ${
                        b.contactedAt
                          ? "bg-brand-light text-brand hover:bg-brand-light/70"
                          : "bg-accent-dark text-white hover:bg-accent-darker"
                      }`}
                      title={b.contactedAt ? `Contacted ${formatDateTime(b.contactedAt)} — tap to undo` : "Mark as contacted"}
                    >
                      {b.contactedAt ? "✓ Contacted" : "Mark contacted"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
