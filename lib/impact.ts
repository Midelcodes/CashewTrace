import "server-only";
import type { Grade } from "@prisma/client";
import { db } from "@/lib/db";
import { MONTHS } from "@/lib/format";
import { toNumber } from "@/lib/money";
import { getSettings } from "@/lib/settings";

// Aggregate impact figures for the hub dashboard (/hub) and the public page (/impact).
// Returns counts, sums and chart series only — never names, phones or per-farmer rows.

/** Programme target: share of registered farmers who are women or youth. */
export const INCLUSION_TARGET_PCT = 60;

export type ImpactScope = { hubId?: string; season?: number }; // season undefined = all seasons

export type ImpactData = Awaited<ReturnType<typeof getImpact>>;

const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

const lagosMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit" });
/** "2026-03" in Lagos time */
const monthKey = (d: Date) => lagosMonth.format(d).slice(0, 7);

export async function getImpact(scope: ImpactScope) {
  const hubWhere = scope.hubId ? { hubId: scope.hubId } : {};
  const [farmers, lots, settings] = await Promise.all([
    db.farmer.findMany({ where: hubWhere, select: { id: true, gender: true, ageGroup: true } }),
    db.lot.findMany({
      where: { ...hubWhere, ...(scope.season && { season: scope.season }) },
      select: {
        farmerId: true,
        weightKg: true,
        status: true,
        receivedAt: true,
        dryingStartedAt: true,
        qualityTest: { select: { grade: true, korLbs: true, moistureBefore: true, moistureAfter: true, dryingMethod: true } },
        sale: { select: { commissionNgn: true, farmerPayoutNgn: true } },
      },
    }),
    getSettings(),
  ]);

  // ---------- farmers (registered = all-time in scope; not season-bound) ----------
  const women = farmers.filter((f) => f.gender === "FEMALE").length;
  const youth = farmers.filter((f) => f.ageGroup === "YOUTH_18_35").length;
  const womenOrYouth = farmers.filter((f) => f.gender === "FEMALE" || f.ageGroup === "YOUTH_18_35").length;
  const activeFarmers = new Set(lots.map((l) => l.farmerId)).size;

  // ---------- volume ----------
  const kg = (l: (typeof lots)[number]) => toNumber(l.weightKg);
  const kgReceived = lots.reduce((s, l) => s + kg(l), 0);
  const sold = lots.filter((l) => l.sale);
  const kgSold = sold.reduce((s, l) => s + kg(l), 0);
  const dried = lots.filter((l) => l.dryingStartedAt || l.qualityTest);
  const kgDried = dried.reduce((s, l) => s + kg(l), 0);

  // ---------- quality ----------
  const tests = lots.flatMap((l) => (l.qualityTest ? [l.qualityTest] : []));
  const kors = tests.map((t) => toNumber(t.korLbs));
  const gradeCount: Record<Grade, number> = { A: 0, B: 0, C: 0, FAIL: 0 };
  for (const t of tests) gradeCount[t.grade]++;
  const rejected = lots.filter((l) => l.status === "REJECTED").length;
  const moistureDrop = avg(tests.map((t) => toNumber(t.moistureBefore) - toNumber(t.moistureAfter)));
  const solarTests = tests.filter((t) => t.dryingMethod === "SOLAR_PLATFORM" || t.dryingMethod === "SOLAR_DRYER").length;

  // ---------- money ----------
  const commissionNgn = sold.reduce((s, l) => s + toNumber(l.sale!.commissionNgn), 0);
  const paidNgn = sold.reduce((s, l) => s + toNumber(l.sale!.farmerPayoutNgn), 0);
  const farmersPaid = new Set(sold.map((l) => l.farmerId)).size;

  // ---------- charts ----------
  const byMonth = new Map<string, number>();
  for (const l of lots) byMonth.set(monthKey(l.receivedAt), (byMonth.get(monthKey(l.receivedAt)) ?? 0) + kg(l));
  const monthKeys = scope.season
    ? Array.from({ length: 12 }, (_, i) => `${scope.season}-${String(i + 1).padStart(2, "0")}`)
    : monthRange([...byMonth.keys()].sort());
  const tonnesByMonth = monthKeys.map((k) => ({
    key: k,
    label: `${MONTHS[Number(k.slice(5)) - 1]}${scope.season ? "" : ` ${k.slice(2, 4)}`}`,
    tonnes: Math.round(((byMonth.get(k) ?? 0) / 1000) * 100) / 100,
  }));

  const korLo = Math.min(40, ...kors.map(Math.floor));
  const korHi = Math.max(52, ...kors.map(Math.floor));
  const korHistogram = Array.from({ length: korHi - korLo + 1 }, (_, i) => {
    const from = korLo + i;
    const band: Grade =
      from >= settings.gradeA_minKor ? "A" : from >= settings.gradeB_minKor ? "B" : from >= settings.gradeC_minKor ? "C" : "FAIL";
    return { bin: String(from), from, lots: kors.filter((k) => k >= from && k < from + 1).length, band };
  });

  const genderAge = (["FEMALE", "MALE"] as const).map((g) => ({
    group: g === "FEMALE" ? "Women" : "Men",
    youth: farmers.filter((f) => f.gender === g && f.ageGroup === "YOUTH_18_35").length,
    adult: farmers.filter((f) => f.gender === g && f.ageGroup === "ADULT_36_PLUS").length,
  }));

  return {
    farmers: {
      registered: farmers.length,
      active: activeFarmers,
      womenPct: pct(women, farmers.length),
      youthPct: pct(youth, farmers.length),
      womenOrYouthPct: pct(womenOrYouth, farmers.length),
    },
    volume: { lots: lots.length, kgReceived, kgSold, kgDried },
    quality: {
      tested: tests.length,
      avgKor: avg(kors),
      abPct: pct(gradeCount.A + gradeCount.B, tests.length),
      rejectionPct: pct(rejected, lots.length),
      rejected,
      moistureDrop,
    },
    money: { commissionNgn, paidNgn, farmersPaid, avgPayoutNgn: farmersPaid ? paidNgn / farmersPaid : null, sales: sold.length },
    environment: {
      spoilageFactor: settings.spoilageAvoidedFactor,
      lossAvoidedKg: kgDried * settings.spoilageAvoidedFactor,
      solarPct: pct(solarTests, tests.length),
      dieselLitres: 0, // the hub model has no diesel dryers: every recorded drying method is solar
    },
    charts: {
      tonnesByMonth,
      grades: (["A", "B", "C", "FAIL"] as const).map((g) => ({ grade: g, lots: gradeCount[g] })),
      korHistogram,
      genderAge,
      thresholds: { A: settings.gradeA_minKor, B: settings.gradeB_minKor, C: settings.gradeC_minKor },
    },
  };
}

/** Continuous list of "YYYY-MM" keys from the first to the last key. */
function monthRange(sorted: string[]): string[] {
  if (!sorted.length) return [];
  const out: string[] = [];
  let [y, m] = sorted[0].split("-").map(Number);
  const [ey, em] = sorted[sorted.length - 1].split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) [y, m] = [y + 1, 1];
  }
  return out;
}

/** Seasons that have lots in scope, newest first, always including the current one. */
export async function impactSeasons(hubId: string | undefined, current: number): Promise<number[]> {
  const rows = await db.lot.findMany({ where: hubId ? { hubId } : {}, distinct: ["season"], select: { season: true } });
  return [...new Set([current, ...rows.map((r) => r.season)])].sort((a, b) => b - a);
}
