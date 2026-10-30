"use server";

import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { normalizeLotCode } from "@/lib/public-lot";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { BuyerInterestSchema } from "@/lib/schemas";

export type InterestState = FormState & { sent?: boolean; contactName?: string };

const MAX_PER_HOUR = 5; // per IP, across all lots
const HOUR = 60 * 60 * 1000;

// Public, unauthenticated action: honeypot + rate limit + zod, and the lot must still be LISTED.
export async function submitInterestAction(_prev: InterestState, formData: FormData): Promise<InterestState> {
  const values = formValues(formData);

  // Honeypot: humans never see the "website" field. Pretend success so bots don't retry.
  if (values.website) return { sent: true };

  const parsed = BuyerInterestSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { lotCode: rawCode, ...data } = parsed.data;

  const limit = rateLimit(`interest:${await clientIp()}`, MAX_PER_HOUR, HOUR);
  if (!limit.allowed) {
    return { error: "Too many enquiries from this connection. Please try again later.", values };
  }

  const lotCode = normalizeLotCode(rawCode);
  const lot = lotCode
    ? await db.lot.findFirst({
        where: { lotCode, status: "LISTED", farmer: { consentGiven: true } },
        select: { id: true },
      })
    : null;
  if (!lot) return { error: "This lot is no longer open for offers.", values };

  await db.buyerInterest.create({ data: { ...data, lotId: lot.id } });
  return { sent: true, contactName: data.contactName };
}
