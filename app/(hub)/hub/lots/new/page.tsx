import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { PageHeader } from "@/components/hub/PageHeader";
import { Avatar } from "@/components/ui/badges";
import { hubScope, requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { lagosToday } from "@/lib/format";
import { NewLotForm } from "./NewLotForm";

export default async function NewLotPage({ searchParams }: { searchParams: Promise<{ farmerId?: string; q?: string }> }) {
  const agent = await requireAgent();
  const { farmerId, q = "" } = await searchParams;

  const farmer = farmerId
    ? await db.farmer.findFirst({
        where: { id: farmerId, ...hubScope(agent) },
        select: { id: true, fullName: true, farmerCode: true, community: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/hub/lots" className="mb-3 inline-block text-sm font-medium text-brand">
        ← Lots
      </Link>
      <PageHeader title="New lot" description="Record raw cashew nuts received from a farmer." />

      <Steps step={farmer ? 2 : 1} />

      {farmer ? (
        <>
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
            <Avatar name={farmer.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{farmer.fullName}</p>
              <p className="text-sm text-ink/70">
                <span className="font-mono text-xs">{farmer.farmerCode}</span> · {farmer.community}
              </p>
            </div>
            <Link href="/hub/lots/new" className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-brand ring-1 ring-brand/30">
              Change
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <NewLotForm farmerId={farmer.id} today={lagosToday()} />
          </div>
        </>
      ) : (
        <FarmerPicker agentScope={hubScope(agent)} q={q.trim()} />
      )}
    </div>
  );
}

function Steps({ step }: { step: 1 | 2 }) {
  const item = (n: number, label: string) => (
    <li className={`flex items-center gap-2 ${step >= n ? "text-brand" : "text-ink/70"}`}>
      <span
        className={`flex size-7 items-center justify-center rounded-full text-sm font-bold ${
          step > n ? "bg-brand text-cream" : step === n ? "bg-brand-light ring-2 ring-brand" : "bg-black/5"
        }`}
      >
        {step > n ? "✓" : n}
      </span>
      <span className="text-sm font-semibold">{label}</span>
    </li>
  );
  return (
    <ol className="mb-5 flex items-center gap-3">
      {item(1, "Farmer")}
      <li aria-hidden="true" className="h-px flex-1 bg-black/10" />
      {item(2, "Bags & weight")}
    </ol>
  );
}

async function FarmerPicker({ agentScope, q }: { agentScope: { hubId?: string }; q: string }) {
  const where: Prisma.FarmerWhereInput = {
    ...agentScope,
    ...(q && {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { farmerCode: { contains: q, mode: "insensitive" } },
        { community: { contains: q, mode: "insensitive" } },
        { phone: { contains: q.replace(/\D/g, "") || q } },
      ],
    }),
  };
  const farmers = await db.farmer.findMany({
    where,
    orderBy: q ? { fullName: "asc" } : { createdAt: "desc" },
    take: 15,
    select: { id: true, fullName: true, farmerCode: true, community: true },
  });

  return (
    <>
      <form action="/hub/lots/new" className="mb-3 flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Name, CTF code, phone or community"
          aria-label="Find farmer"
          className="h-12 min-w-0 flex-1 rounded-xl border border-black/15 bg-white px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
        <button type="submit" className="h-12 rounded-xl bg-ink px-4 text-sm font-semibold text-cream">
          Find
        </button>
      </form>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/70">
        {q ? `${farmers.length} match${farmers.length === 1 ? "" : "es"}` : "Recently registered"}
      </p>

      {farmers.length > 0 && (
        <ul className="mb-4 divide-y divide-black/5 overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          {farmers.map((f) => (
            <li key={f.id}>
              <Link href={`/hub/lots/new?farmerId=${f.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-cream active:bg-cream">
                <Avatar name={f.fullName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{f.fullName}</p>
                  <p className="truncate text-sm text-ink/70">
                    <span className="font-mono text-xs">{f.farmerCode}</span> · {f.community}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand">Select →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-dashed border-black/20 p-4 text-center">
        <p className="text-sm text-ink/70">{farmers.length === 0 ? "No farmer found." : "Farmer not on the list?"}</p>
        <Link
          href="/hub/farmers/new"
          className="mt-2 inline-flex h-11 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-cream"
        >
          + Quick-register a farmer
        </Link>
      </div>
    </>
  );
}
