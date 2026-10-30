import { db } from "@/lib/db";
import { toNumber } from "@/lib/money";

// Seeded defaults for the single Settings row (id = 1). Admins edit the row; these only fill an empty DB.
export const SETTING_DEFAULTS = {
  farmGatePricePerTonneNgn: 1_900_000, // placeholder — update to current market price in Settings
  commissionRate: 0.02, // 2%, paid by the buyer
  dryingTestFeePerBagNgn: 500,
  storageFeePerBagPerMonthNgn: 200,
  moistureMaxPct: 10,
  gradeA_minKor: 48,
  gradeB_minKor: 45,
  gradeC_minKor: 42,
  spoilageAvoidedFactor: 0.05, // estimate: share of solar-dried tonnage saved from spoilage
};

export type AppSettings = typeof SETTING_DEFAULTS & { updatedAt: Date };

export async function getSettings(): Promise<AppSettings> {
  // Read first (public pages call this on every view); only write when the row is missing.
  const row =
    (await db.settings.findUnique({ where: { id: 1 } })) ??
    (await db.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...SETTING_DEFAULTS } }));
  return {
    farmGatePricePerTonneNgn: toNumber(row.farmGatePricePerTonneNgn),
    commissionRate: toNumber(row.commissionRate),
    dryingTestFeePerBagNgn: toNumber(row.dryingTestFeePerBagNgn),
    storageFeePerBagPerMonthNgn: toNumber(row.storageFeePerBagPerMonthNgn),
    moistureMaxPct: toNumber(row.moistureMaxPct),
    gradeA_minKor: toNumber(row.gradeA_minKor),
    gradeB_minKor: toNumber(row.gradeB_minKor),
    gradeC_minKor: toNumber(row.gradeC_minKor),
    spoilageAvoidedFactor: toNumber(row.spoilageAvoidedFactor),
    updatedAt: row.updatedAt,
  };
}
