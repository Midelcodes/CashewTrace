import "server-only";
import type { Grade, LotStatus, Prisma } from "@prisma/client";
import { cache } from "react";
import { db } from "@/lib/db";
import { initials } from "@/lib/ids";
import { toNumber } from "@/lib/money";

// Everything the public verification page may show. This is the privacy boundary:
// no farmer name, phone, exact location, buyer identity, prices or payouts leave this module.

export type PublicEvent = { id: string; action: string; detail: string; createdAt: Date };

export type PublicLot = {
  lotCode: string;
  season: number;
  harvestMonth: number;
  status: LotStatus;
  bags: number;
  weightKg: number;
  hubName: string;
  origin: {
    country: "Nigeria";
    state: string;
    lga: string;
    community: string;
    farmerInitials: string;
    farmSizeBand: string;
  };
  test: {
    grade: Grade;
    moistureBefore: number;
    moistureAfter: number;
    korLbs: number;
    nutCountPerKg: number | null;
    defectivePct: number | null;
    dryingDays: number;
    dryingMethod: string;
    testedAt: Date;
    testedBy: string; // first name only
  } | null;
  events: PublicEvent[];
};

const LOT_CODE = /^CT-[A-Z]{3}-\d{4}-\d{6}$/;

/** Accepts "ct-kog-2026-000046", " CT-KOG-2026-000046 ", or a full /v/... URL. Returns null if malformed. */
export function normalizeLotCode(raw: string): string | null {
  let code = raw.trim();
  try {
    code = decodeURIComponent(code);
  } catch {
    return null;
  }
  const fromUrl = code.match(/\/v\/([^/?#\s]+)/i);
  if (fromUrl) code = fromUrl[1];
  code = code.toUpperCase();
  return LOT_CODE.test(code) ? code : null;
}

export function farmSizeBand(ha: number): string {
  if (ha < 1) return "Smallholder, under 1 ha";
  if (ha < 2) return "Smallholder, 1–2 ha";
  if (ha < 5) return "Small farm, 2–5 ha";
  return "Medium farm, 5 ha or more";
}

const DRYING_METHOD: Record<string, string> = {
  SOLAR_PLATFORM: "Solar platform",
  SOLAR_DRYER: "Solar dryer",
  TARPAULIN: "Tarpaulin",
};

const firstName = (name: string) => name.trim().split(/\s+/)[0];

/** Cached per request so generateMetadata and the page share one query. */
export const getPublicLot = cache(async (rawCode: string): Promise<PublicLot | null> => {
  const lotCode = normalizeLotCode(rawCode);
  if (!lotCode) return null;

  const lot = await db.lot.findUnique({
    where: { lotCode },
    include: {
      farmer: { select: { fullName: true, community: true, lga: true, state: true, farmSizeHa: true, consentGiven: true } },
      hub: { select: { name: true } },
      qualityTest: { include: { testedBy: { select: { name: true } } } },
    },
  });
  // Without the farmer's consent nothing about the lot is published.
  if (!lot || !lot.farmer.consentGiven) return null;

  const audit = await db.auditLog.findMany({
    where: { entity: "Lot", entityId: lot.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, action: true, createdAt: true },
  });

  const t = lot.qualityTest;
  const test = t && {
    grade: t.grade,
    moistureBefore: toNumber(t.moistureBefore),
    moistureAfter: toNumber(t.moistureAfter),
    korLbs: toNumber(t.korLbs),
    nutCountPerKg: t.nutCountPerKg,
    defectivePct: t.defectivePct === null ? null : toNumber(t.defectivePct),
    dryingDays: t.dryingDays,
    dryingMethod: DRYING_METHOD[t.dryingMethod] ?? t.dryingMethod,
    testedAt: t.testedAt,
    testedBy: firstName(t.testedBy.name),
  };

  // Public wording per event - audit `detail` is never exposed (it holds buyer names and prices).
  const describe: Record<string, () => string> = {
    RECEIVED: () => `${lot.bags} bags received at ${lot.hub.name}`,
    DRYING_STARTED: () => "Solar drying started",
    MOISTURE_CHECK: () => "Moisture re-checked, dried for longer",
    TESTED: () => (test ? `Moisture and KOR tested · ${test.grade === "FAIL" ? "below minimum grade" : `Grade ${test.grade}`}` : "Quality tested"),
    LISTED: () => "Listed for buyers",
    RESERVED: () => "Reserved for a buyer",
    SOLD: () => "Sold to a buyer",
    REJECTED: () => "Withdrawn from sale",
  };
  const events = audit
    .filter((a) => describe[a.action])
    .map((a) => ({ id: a.id, action: a.action, createdAt: a.createdAt, detail: describe[a.action]() }));

  return {
    lotCode: lot.lotCode,
    season: lot.season,
    harvestMonth: lot.harvestMonth,
    status: lot.status,
    bags: lot.bags,
    weightKg: toNumber(lot.weightKg),
    hubName: lot.hub.name,
    origin: {
      country: "Nigeria",
      state: lot.farmer.state,
      lga: lot.farmer.lga,
      community: lot.farmer.community,
      farmerInitials: initials(lot.farmer.fullName),
      farmSizeBand: farmSizeBand(toNumber(lot.farmer.farmSizeHa)),
    },
    test,
    events,
  };
});

// ---------- public catalogue (/lots) ----------

export type CatalogueFilters = {
  grade?: "A" | "B" | "C";
  season?: number;
  state?: string;
  minKor?: number;
  sort: "kor" | "weight";
};

export type CatalogueLot = {
  lotCode: string;
  grade: Grade;
  korLbs: number;
  moistureAfter: number;
  weightKg: number;
  bags: number;
  season: number;
  state: string;
  lga: string;
};

/** Lots open to offers: LISTED, passed grading, farmer consented. No prices, names or hub contacts. */
const AVAILABLE = {
  status: "LISTED",
  qualityTest: { grade: { not: "FAIL" } },
  farmer: { consentGiven: true },
} satisfies Prisma.LotWhereInput;

export async function getListedLots(f: CatalogueFilters): Promise<CatalogueLot[]> {
  const lots = await db.lot.findMany({
    where: {
      ...AVAILABLE,
      ...(f.season && { season: f.season }),
      farmer: { consentGiven: true, ...(f.state && { state: f.state }) },
      qualityTest: {
        grade: f.grade ?? { not: "FAIL" },
        ...(f.minKor && { korLbs: { gte: f.minKor } }),
      },
    },
    orderBy: [
      f.sort === "weight" ? { weightKg: "desc" } : { qualityTest: { korLbs: "desc" } },
      { lotCode: "asc" },
    ],
    select: {
      lotCode: true,
      weightKg: true,
      bags: true,
      season: true,
      farmer: { select: { state: true, lga: true } },
      qualityTest: { select: { grade: true, korLbs: true, moistureAfter: true } },
    },
  });
  return lots.map((l) => ({
    lotCode: l.lotCode,
    grade: l.qualityTest!.grade,
    korLbs: toNumber(l.qualityTest!.korLbs),
    moistureAfter: toNumber(l.qualityTest!.moistureAfter),
    weightKg: toNumber(l.weightKg),
    bags: l.bags,
    season: l.season,
    state: l.farmer.state,
    lga: l.farmer.lga,
  }));
}

/** Everything currently available, plus filter options - independent of the active filters. */
export async function getCatalogueSummary() {
  const lots = await db.lot.findMany({
    where: AVAILABLE,
    select: {
      weightKg: true,
      season: true,
      farmer: { select: { state: true } },
      qualityTest: { select: { grade: true, korLbs: true } },
    },
  });
  const byGrade = { A: { kg: 0, lots: 0 }, B: { kg: 0, lots: 0 }, C: { kg: 0, lots: 0 } };
  let totalKg = 0;
  let korSum = 0;
  for (const l of lots) {
    const kg = toNumber(l.weightKg);
    const g = l.qualityTest!.grade as keyof typeof byGrade;
    totalKg += kg;
    korSum += toNumber(l.qualityTest!.korLbs);
    byGrade[g].kg += kg;
    byGrade[g].lots += 1;
  }
  return {
    totalKg,
    lotCount: lots.length,
    avgKor: lots.length ? korSum / lots.length : null,
    byGrade,
    seasons: [...new Set(lots.map((l) => l.season))].sort((a, b) => b - a),
    states: [...new Set(lots.map((l) => l.farmer.state))].sort(),
  };
}
