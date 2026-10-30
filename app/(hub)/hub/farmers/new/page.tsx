import Link from "next/link";
import { PageHeader } from "@/components/hub/PageHeader";
import { requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { FarmerForm } from "./FarmerForm";

export default async function NewFarmerPage() {
  const agent = await requireAgent();
  const [hub, communities] = await Promise.all([
    db.hub.findUniqueOrThrow({ where: { id: agent.hubId }, select: { lga: true, state: true } }),
    db.farmer.findMany({
      where: { hubId: agent.hubId },
      distinct: ["community"],
      select: { community: true },
      orderBy: { community: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/hub/farmers" className="mb-3 inline-block text-sm font-medium text-brand">
        ← Farmers
      </Link>
      <PageHeader title="Register farmer" description={`Joins ${agent.hub.name}. Farmer code is assigned automatically.`} />
      <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <FarmerForm lga={hub.lga} state={hub.state} communities={communities.map((c) => c.community)} />
      </div>
    </div>
  );
}
