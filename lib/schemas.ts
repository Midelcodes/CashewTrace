import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Shared zod schemas for server actions. Inputs arrive as FormData strings.

/** 11 digits starting with 0, or +234 followed by 10 digits (spaces/dashes allowed). Stored as 11 digits. */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s\-()]/g, ""))
  .pipe(z.string().regex(/^(0\d{10}|\+234\d{10})$/, "Enter 11 digits starting with 0, or +234 and 10 digits"))
  .transform(normalizePhone);

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

export const FarmerSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the farmer's full name").max(80),
  phone: phoneSchema,
  gender: z.enum(["FEMALE", "MALE"], { error: "Choose gender" }),
  ageGroup: z.enum(["YOUTH_18_35", "ADULT_36_PLUS"], { error: "Choose age group" }),
  community: z.string().trim().min(2, "Enter the community").max(60),
  lga: z.string().trim().min(2, "Enter the LGA").max(60),
  state: z.string().trim().min(2, "Enter the state").max(40),
  farmSizeHa: z.coerce
    .number({ error: "Enter farm size in hectares" })
    .min(0.1, "Farm size must be 0.1–50 ha")
    .max(50, "Farm size must be 0.1–50 ha")
    .transform((n) => Math.round(n * 100) / 100),
  numberOfTrees: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: "Enter a number" }).int("Enter a whole number").min(1).max(100_000).optional(),
  ),
  cooperative: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  consentGiven: z
    .literal("on", { error: "Consent is required to register a farmer" })
    .transform(() => true as const),
});

// ---------- lot workflow ----------

const number = (label: string, min: number, max: number, unit = "", message?: string) => {
  const range = message ?? `${label[0].toUpperCase()}${label.slice(1)} must be ${min}–${max}${unit}`;
  return z.coerce.number({ error: `Enter ${label}` }).min(min, range).max(max, range);
};

const oneDecimal = (n: number) => Math.round(n * 10) / 10;
const lotId = z.string().min(1);

export const NewLotSchema = z.object({
  farmerId: z.string().min(1, "Choose a farmer"),
  bags: number("bags", 1, 1000).int("Enter a whole number of bags"),
  weightKg: number("total weight", 1, 80_000, " kg").transform((n) => Math.round(n * 100) / 100),
  harvestMonth: z.coerce.number({ error: "Choose harvest month" }).int().min(1, "Choose harvest month").max(12),
  season: z.coerce.number({ error: "Choose season" }).int().min(2020).max(2100),
});

export const StartDryingSchema = z.object({
  lotId,
  moistureBefore: number("moisture", 3, 40, "%").transform(oneDecimal),
});

export const QualityTestSchema = z.object({
  lotId,
  moistureAfter: number("moisture", 3, 40, "%").transform(oneDecimal),
  korLbs: number("KOR", 20, 70, " lbs").transform(oneDecimal),
  nutCountPerKg: z.preprocess(
    emptyToUndefined,
    z.coerce.number({ error: "Enter a number" }).int("Enter a whole number").min(50).max(500).optional(),
  ),
  defectivePct: z.preprocess(emptyToUndefined, number("defective %", 0, 100, "%").transform(oneDecimal).optional()),
  dryingDays: number("drying days", 0, 60).int("Enter whole days"),
});

export const LotIdSchema = z.object({ lotId });

export const SaleSchema = z.object({
  lotId,
  buyerName: z.string().trim().min(2, "Enter the buyer's name").max(100),
  pricePerTonneNgn: number("price per tonne", 100_000, 20_000_000, "", "Price must be ₦100,000–₦20,000,000 per tonne").transform((n) => Math.round(n)),
});

export const RejectSchema = z.object({
  lotId,
  reason: z.string().trim().min(3, "Give a reason for rejecting this lot").max(200),
});

// ---------- public buyer interest ----------

export const BuyerInterestSchema = z.object({
  lotCode: z.string().min(1),
  companyName: z.string().trim().min(2, "Enter your company name").max(120),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(120)),
  // Buyers may be abroad, so any international format is accepted.
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-().]{7,20}$/, "Enter a phone number, e.g. +234 803 123 4567"),
  message: z.string().trim().max(1000, "Keep the message under 1,000 characters").default(""),
});

// ---------- admin: settings & agents ----------

/** Percentages are entered as 0–100 in the form and stored as fractions (commission 2 → 0.02). */
export const SettingsSchema = z
  .object({
    farmGatePricePerTonneNgn: number("farm-gate price", 100_000, 20_000_000, "", "Price must be ₦100,000–₦20,000,000 per tonne").transform(Math.round),
    commissionPct: number("commission", 0, 20, "%"),
    dryingTestFeePerBagNgn: number("drying & testing fee", 0, 100_000, "", "Fee must be ₦0–₦100,000 per bag").transform(Math.round),
    storageFeePerBagPerMonthNgn: number("storage fee", 0, 100_000, "", "Fee must be ₦0–₦100,000 per bag per month").transform(Math.round),
    moistureMaxPct: number("maximum moisture", 5, 20, "%"),
    gradeA_minKor: number("grade A minimum", 30, 60, " lbs"),
    gradeB_minKor: number("grade B minimum", 30, 60, " lbs"),
    gradeC_minKor: number("grade C minimum", 30, 60, " lbs"),
    spoilageAvoidedPct: number("spoilage-avoided factor", 0, 50, "%"),
  })
  .refine((s) => s.gradeA_minKor > s.gradeB_minKor && s.gradeB_minKor > s.gradeC_minKor, {
    path: ["gradeA_minKor"],
    message: "Thresholds must go down: A > B > C",
  })
  .transform(({ commissionPct, spoilageAvoidedPct, ...s }) => ({
    ...s,
    commissionRate: Math.round(commissionPct * 100) / 10_000,
    spoilageAvoidedFactor: Math.round(spoilageAvoidedPct * 100) / 10_000,
  }));

const pinSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits");

export const NewAgentSchema = z.object({
  name: z.string().trim().min(3, "Enter the agent's full name").max(80),
  phone: phoneSchema,
  gender: z.enum(["FEMALE", "MALE"], { error: "Choose gender" }),
  isYouth: z.preprocess((v) => v === "on", z.boolean()),
  hubId: z.string().min(1, "Choose a hub"),
  pin: pinSchema,
});

export const ResetPinSchema = z.object({ agentId: z.string().min(1), pin: pinSchema });
export const AgentIdSchema = z.object({ agentId: z.string().min(1) });
