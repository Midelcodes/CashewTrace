import type { LotStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/hub/PageHeader";
import { CountBadge, GradeBadge, STATUS_LABEL, StatusBadge } from "@/components/ui/badges";
import { FilterChips } from "@/components/ui/FilterChips";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatKg, toNumber } from "@/lib/money";

type Search = { q?: string; status?: string; limit?: string };

const STATUSES = Object.keys(STATUS_LABEL) as LotStatus[];
const PAGE = 50;

function hrefWith(current: Search, patch: Partial<Search>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, limit: undefined, ...patch })) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/hub/lots?${qs}` : "/hub/lots";
}

export default async function LotsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const agent = await requireAgent();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = STATUSES.includes(sp.status as LotStatus) ? (sp.status as LotStatus) : undefined;
  const limit = Math.min(Math.max(Number(sp.limit) || PAGE, PAGE), 1000);
  const current: Search = { q, status };

  const scope = hubScope(agent);
  const searchWhere: Prisma.LotWhereInput = {
    ...scope,
    ...(q && {
      OR: [
        { lotCode: { contains: q, mode: "insensitive" } },
        { farmer: { fullName: { contains: q, mode: "insensitive" } } },
        { farmer: { farmerCode: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const where: Prisma.LotWhereInput = { ...searchWhere, ...(status && { status }) };

  const [lots, matching, byStatus] = await Promise.all([
    db.lot.findMany({
      where,
      orderBy: { receivedAt: "desc" },
      take: limit,
      select: {
        id: true,
        lotCode: true,
        bags: true,
        weightKg: true,
        status: true,
        receivedAt: true,
        farmer: { select: { fullName: true, community: true } },
        hub: { select: { code: true } },
        qualityTest: { select: { grade: true, korLbs: true } },
      },
    }),
    db.lot.count({ where }),
    db.lot.groupBy({ by: ["status"], where: searchWhere, _count: true }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count])) as Partial<Record<LotStatus, number>>;
  const totalForSearch = byStatus.reduce((s, r) => s + r._count, 0);

  const statusOptions = [
    { value: "", label: "All", count: totalForSearch },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s], count: counts[s] ?? 0 })),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Lots"
        badge={<CountBadge count={matching} />}
        description={agent.role === "ADMIN" ? "All hubs" : agent.hub.name}
      />

      <form action="/hub/lots" className="mb-3 flex gap-2" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Lot code or farmer"
          aria-label="Search lots"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" className="h-12 rounded-xl bg-ink px-4 text-sm font-semibold text-cream">
          Search
        </button>
      </form>

      <div className="mb-5">
        <FilterChips label="Status" options={statusOptions} active={status ?? ""} href={(v) => hrefWith(current, { status: v })} />
      </div>

      {lots.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <p className="font-semibold">No lots found</p>
          {(q || status) && (
            <Link href="/hub/lots" className="mt-2 inline-block text-sm font-medium text-brand underline">
              Clear search and filters
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          {lots.map((l) => (
            <li key={l.id}>
              <Link href={`/hub/lots/${l.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream active:bg-cream">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold">{l.lotCode}</p>
                  <p className="truncate text-sm">
                    {l.farmer.fullName} <span className="text-ink/70">· {l.farmer.community}</span>
                  </p>
                  <p className="text-xs text-ink/70">
                    {l.bags} bags · {formatKg(toNumber(l.weightKg))} · {formatDate(l.receivedAt)}
                    {agent.role === "ADMIN" && ` · ${l.hub.code}`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {l.qualityTest ? <GradeBadge grade={l.qualityTest.grade} /> : <span className="text-xs text-ink/70">Not graded</span>}
                  <StatusBadge status={l.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {matching > lots.length && (
        <Link
          href={`${hrefWith(current, {})}${q || status ? "&" : "?"}limit=${limit + PAGE}`}
          className="mt-4 flex h-12 items-center justify-center rounded-xl bg-white text-sm font-semibold text-brand ring-1 ring-black/10"
        >
          Show more ({matching - lots.length} more)
        </Link>
      )}
    </div>
  );
}
