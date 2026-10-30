import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getImpact } from "@/lib/impact";
import { getSettings } from "@/lib/settings";

/** Cache tag — saving Settings invalidates it so the landing page shows new fees/commission at once. */
export const LANDING_STATS_TAG = "landing-stats";

/** Aggregate figures for the landing page, cached for 5 minutes so the page stays fast. */
export const getLandingStats = unstable_cache(
  async () => {
    const [impact, agents, settings] = await Promise.all([
      getImpact({}),
      db.agent.findMany({ where: { role: "AGENT", active: true }, select: { gender: true, isYouth: true } }),
      getSettings(),
    ]);
    const agentsWomenOrYouth = agents.filter((a) => a.gender === "FEMALE" || a.isYouth).length;
    return {
      farmers: impact.farmers.registered,
      farmersWomenOrYouthPct: impact.farmers.womenOrYouthPct,
      kgDried: impact.volume.kgDried,
      paidNgn: impact.money.paidNgn,
      avgKor: impact.quality.avgKor,
      lossAvoidedKg: impact.environment.lossAvoidedKg,
      agents: agents.length,
      agentsWomenOrYouth,
      commissionPct: Math.round(settings.commissionRate * 1000) / 10,
      feePerBagNgn: settings.dryingTestFeePerBagNgn,
    };
  },
  ["landing-stats"],
  { revalidate: 300, tags: [LANDING_STATS_TAG] },
);
