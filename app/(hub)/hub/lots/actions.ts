"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodType } from "zod";
import { hubScope, requireAgent, type CurrentAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { gradeLot } from "@/lib/grading";
import { LotStateError, logLotEvent, nextLotCode, REJECTABLE, transitionLot } from "@/lib/lots";
import { calculateSale, formatKg, formatNaira, toNumber } from "@/lib/money";
import {
  LotIdSchema,
  NewLotSchema,
  QualityTestSchema,
  RejectSchema,
  SaleSchema,
  StartDryingSchema,
} from "@/lib/schemas";
import { withUniqueRetry } from "@/lib/sequences";
import { getSettings } from "@/lib/settings";

// Every action: require a session, validate with zod, scope to the agent's hub,
// and change status only through transitionLot (which also writes the audit log).

type Parsed<T> = { ok: true; agent: CurrentAgent; data: T; values: Record<string, string> } | { ok: false; state: FormState };

async function parse<T>(schema: ZodType<T>, formData: FormData): Promise<Parsed<T>> {
  const agent = await requireAgent();
  const values = formValues(formData);
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, state: { fieldErrors: fieldErrors(parsed.error), values } };
  return { ok: true, agent, data: parsed.data, values };
}

/** Run a state change; stale-state errors become a friendly form error. */
async function guarded(lotId: string, values: Record<string, string>, fn: () => Promise<unknown>): Promise<FormState> {
  try {
    await fn();
  } catch (e) {
    if (e instanceof LotStateError) return { error: e.message, values };
    throw e;
  }
  revalidatePath(`/hub/lots/${lotId}`);
  return {};
}

export async function createLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(NewLotSchema, formData);
  if (!p.ok) return p.state;
  const { agent, data, values } = p;

  const farmer = await db.farmer.findFirst({
    where: { id: data.farmerId, ...hubScope(agent) },
    select: { id: true, hubId: true, state: true },
  });
  if (!farmer) return { error: "Farmer not found in your hub.", values };

  const lot = await withUniqueRetry(async () => {
    const lotCode = await nextLotCode(farmer.state, data.season);
    return db.$transaction(async (tx) => {
      const created = await tx.lot.create({
        data: { ...data, lotCode, farmerId: farmer.id, hubId: farmer.hubId, agentId: agent.id, status: "RECEIVED" },
      });
      await logLotEvent(tx, created.id, agent.id, "RECEIVED", `${data.bags} bags · ${formatKg(data.weightKg)}`);
      return created;
    });
  });

  redirect(`/hub/lots/${lot.id}?created=1`);
}

export async function startDryingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(StartDryingSchema, formData);
  if (!p.ok) return p.state;
  const { agent, data, values } = p;

  return guarded(data.lotId, values, () =>
    db.$transaction((tx) =>
      transitionLot(tx, {
        where: { id: data.lotId, ...hubScope(agent) },
        from: ["RECEIVED"],
        data: { status: "DRYING", moistureBefore: data.moistureBefore, dryingStartedAt: new Date() },
        agentId: agent.id,
        event: "DRYING_STARTED",
        detail: `Solar platform · moisture ${data.moistureBefore}%`,
      }),
    ),
  );
}

export async function qualityTestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(QualityTestSchema, formData);
  if (!p.ok) return p.state;
  const { agent, data, values } = p;

  const lot = await db.lot.findFirst({
    where: { id: data.lotId, ...hubScope(agent) },
    select: { id: true, status: true, moistureBefore: true },
  });
  if (!lot) return { error: "Lot not found.", values };
  if (lot.status !== "DRYING") return { error: "This lot has already moved on. Refresh the page.", values };

  const settings = await getSettings();
  const { lotId, moistureAfter, korLbs, ...rest } = data;
  const grade = gradeLot({ moistureAfter, korLbs }, settings);

  // Too wet: no test is saved, the lot stays in DRYING, and the check is logged on the timeline.
  if (moistureAfter > settings.moistureMaxPct) {
    await db.$transaction((tx) =>
      logLotEvent(tx, lotId, agent.id, "MOISTURE_CHECK", `Moisture ${moistureAfter}%, above ${settings.moistureMaxPct}%: continue drying`),
    );
    revalidatePath(`/hub/lots/${lotId}`);
    return {
      warning: `Moisture too high: continue drying. ${moistureAfter}% is above the ${settings.moistureMaxPct}% maximum. Test again after more sun.`,
      values,
    };
  }

  return guarded(lotId, values, () =>
    db.$transaction(async (tx) => {
      await transitionLot(tx, {
        where: { id: lotId, ...hubScope(agent) },
        from: ["DRYING"],
        data: { status: "TESTED" },
        agentId: agent.id,
        event: "TESTED",
        detail: `${grade === "FAIL" ? "Fail" : `Grade ${grade}`} · KOR ${korLbs} lbs · moisture ${moistureAfter}%`,
      });
      await tx.qualityTest.create({
        data: {
          lotId,
          moistureBefore: lot.moistureBefore ?? moistureAfter,
          moistureAfter,
          korLbs,
          grade,
          testedById: agent.id,
          ...rest,
        },
      });
    }),
  );
}

export async function listLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(LotIdSchema, formData);
  if (!p.ok) return { error: "Missing lot." };
  const { agent, data, values } = p;

  return guarded(data.lotId, values, () =>
    db.$transaction((tx) =>
      transitionLot(tx, {
        // Only graded lots (A/B/C) can be offered to buyers.
        where: { id: data.lotId, ...hubScope(agent), qualityTest: { grade: { not: "FAIL" } } },
        from: ["TESTED"],
        data: { status: "LISTED" },
        agentId: agent.id,
        event: "LISTED",
        detail: "Listed for sale to buyers",
      }),
    ),
  );
}

export async function recordSaleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(SaleSchema, formData);
  if (!p.ok) return p.state;
  const { agent, data, values } = p;

  const lot = await db.lot.findFirst({
    where: { id: data.lotId, ...hubScope(agent) },
    select: { bags: true, weightKg: true },
  });
  if (!lot) return { error: "Lot not found.", values };

  const settings = await getSettings();
  const breakdown = calculateSale(
    { weightKg: toNumber(lot.weightKg), bags: lot.bags, pricePerTonneNgn: data.pricePerTonneNgn },
    settings,
  );

  return guarded(data.lotId, values, () =>
    db.$transaction(async (tx) => {
      await transitionLot(tx, {
        where: { id: data.lotId, ...hubScope(agent) },
        from: ["LISTED", "RESERVED"],
        data: { status: "SOLD" },
        agentId: agent.id,
        event: "SOLD",
        detail: `${data.buyerName} · ${formatNaira(data.pricePerTonneNgn)}/t · farmer payout ${formatNaira(breakdown.farmerPayoutNgn)}`,
      });
      await tx.sale.create({
        data: { lotId: data.lotId, buyerName: data.buyerName, pricePerTonneNgn: data.pricePerTonneNgn, ...breakdown },
      });
    }),
  );
}

export async function rejectLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const p = await parse(RejectSchema, formData);
  if (!p.ok) return p.state;
  const { agent, data, values } = p;

  return guarded(data.lotId, values, () =>
    db.$transaction((tx) =>
      transitionLot(tx, {
        where: { id: data.lotId, ...hubScope(agent) },
        from: REJECTABLE,
        data: { status: "REJECTED", rejectionReason: data.reason },
        agentId: agent.id,
        event: "REJECTED",
        detail: data.reason,
      }),
    ),
  );
}
