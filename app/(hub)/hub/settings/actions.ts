"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { LANDING_STATS_TAG } from "@/lib/landing";
import { formatNaira } from "@/lib/money";
import { SettingsSchema } from "@/lib/schemas";
import { getSettings, SETTING_DEFAULTS } from "@/lib/settings";

export type SettingsState = FormState & { saved?: boolean };

const LABELS: Record<keyof typeof SETTING_DEFAULTS, string> = {
  farmGatePricePerTonneNgn: "Farm-gate price",
  commissionRate: "Commission",
  dryingTestFeePerBagNgn: "Drying & testing fee",
  storageFeePerBagPerMonthNgn: "Storage fee",
  moistureMaxPct: "Max moisture",
  gradeA_minKor: "Grade A min KOR",
  gradeB_minKor: "Grade B min KOR",
  gradeC_minKor: "Grade C min KOR",
  spoilageAvoidedFactor: "Spoilage-avoided factor",
};

/** Human-readable value for the audit trail: % for rates, ₦ for money. */
function show(key: keyof typeof SETTING_DEFAULTS, value: number): string {
  if (key === "commissionRate" || key === "spoilageAvoidedFactor") return `${Math.round(value * 10_000) / 100}%`;
  if (key.endsWith("Ngn")) return formatNaira(value);
  if (key === "moistureMaxPct") return `${value}%`;
  return `${value} lbs`;
}

export async function saveSettingsAction(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin();
  const values = formValues(formData);
  const parsed = SettingsSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const before = await getSettings();
  const changed = (Object.keys(LABELS) as (keyof typeof LABELS)[]).filter((k) => before[k] !== parsed.data[k]);
  if (changed.length === 0) return { saved: true };

  await db.$transaction([
    db.settings.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } }),
    db.auditLog.create({
      data: {
        agentId: admin.id,
        action: "UPDATE",
        entity: "Settings",
        entityId: "1",
        detail: changed.map((k) => `${LABELS[k]}: ${show(k, before[k])} → ${show(k, parsed.data[k])}`).join("; "),
      },
    }),
  ]);

  // Fees, commission and thresholds show up across the app; the landing page caches them.
  revalidateTag(LANDING_STATS_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return { saved: true };
}
