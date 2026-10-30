import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/hub/PageHeader";
import { PlusIcon } from "@/components/icons";
import { Avatar, CountBadge } from "@/components/ui/badges";
import { FilterChips } from "@/components/ui/FilterChips";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";

type Search = { q?: string; gender?: string; age?: string };

const GENDER_FILTERS = [
  { value: "", label: "All" },
  { value: "FEMALE", label: "Women" },
  { value: "MALE", label: "Men" },
] as const;

const AGE_FILTERS = [
  { value: "", label: "All ages" },
  { value: "YOUTH_18_35", label: "Youth 18–35" },
  { value: "ADULT_36_PLUS", label: "36+" },
] as const;

function hrefWith(current: Search, patch: Partial<Search>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...current, ...patch })) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `/hub/farmers?${qs}` : "/hub/farmers";
}

export default async function FarmersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const agent = await requireAgent();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const gender = GENDER_FILTERS.some((f) => f.value === sp.gender) ? sp.gender : "";
  const age = AGE_FILTERS.some((f) => f.value === sp.age) ? sp.age : "";
  const current: Search = { q, gender, age };

  const where: Prisma.FarmerWhereInput = {
    ...hubScope(agent),
    ...(gender && { gender: gender as "FEMALE" | "MALE" }),
    ...(age && { ageGroup: age as "YOUTH_18_35" | "ADULT_36_PLUS" }),
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { farmerCode: { contains: q, mode: "insensitive" } },
        { community: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [farmers, total] = await Promise.all([
    db.farmer.findMany({
      where,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        farmerCode: true,
        community: true,
        hub: { select: { code: true } },
        _count: { select: { lots: true } },
      },
    }),
    db.farmer.count({ where: hubScope(agent) }),
  ]);
  const filtered = Boolean(q || gender || age);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Farmers"
        badge={<CountBadge count={farmers.length} />}
        description={filtered ? `${farmers.length} of ${total} match` : agent.role === "ADMIN" ? "All hubs" : agent.hub.name}
        action={
          <Link
            href="/hub/farmers/new"
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-cream transition hover:bg-brand-dark"
          >
            <PlusIcon className="size-5" />
            Register
          </Link>
        }
      />

      <form action="/hub/farmers" className="mb-3 flex gap-2" role="search">
        {gender && <input type="hidden" name="gender" value={gender} />}
        {age && <input type="hidden" name="age" value={age} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, CTF code or community"
          aria-label="Search farmers"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" className="h-12 rounded-xl bg-ink px-4 text-sm font-semibold text-cream">
          Search
        </button>
      </form>

      <div className="mb-5 flex flex-col gap-2">
        <FilterChips label="Gender" options={GENDER_FILTERS} active={gender ?? ""} href={(v) => hrefWith(current, { gender: v })} />
        <FilterChips label="Age group" options={AGE_FILTERS} active={age ?? ""} href={(v) => hrefWith(current, { age: v })} />
      </div>

      {farmers.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/5">
          <p className="font-semibold">No farmers found</p>
          {filtered && (
            <Link href="/hub/farmers" className="mt-2 inline-block text-sm font-medium text-brand underline">
              Clear search and filters
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          {farmers.map((f) => (
            <li key={f.id}>
              <Link href={`/hub/farmers/${f.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream active:bg-cream">
                <Avatar name={f.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{f.fullName}</p>
                  <p className="truncate text-sm text-ink/70">
                    <span className="font-mono text-xs">{f.farmerCode}</span> · {f.community}
                    {agent.role === "ADMIN" && <span className="text-xs"> · {f.hub.code}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold leading-none text-brand">{f._count.lots}</p>
                  <p className="text-xs text-ink/70">{f._count.lots === 1 ? "lot" : "lots"}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
