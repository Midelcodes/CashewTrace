"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { fieldErrors, type FormState } from "@/lib/forms";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { phoneSchema } from "@/lib/schemas";
import { getSession } from "@/lib/session";

const MAX_ATTEMPTS = 5; // per phone + IP
const MAX_ATTEMPTS_PER_PHONE = 20; // across all IPs
const WINDOW_MS = 15 * 60 * 1000;
const GENERIC_ERROR = "Phone number or PIN is incorrect.";

// Compared against when the phone is unknown, so both paths take the same time.
const dummyHash = bcrypt.hash("cashewtrace-no-such-agent", 10);

const LoginSchema = z.object({
  phone: phoneSchema,
  pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4–6 digits"),
  next: z.string().optional(),
});

// Only allow redirects back into the hub app (no open redirects).
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/hub") && !next.startsWith("//") ? next : "/hub";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { phone: String(formData.get("phone") ?? ""), pin: String(formData.get("pin") ?? "") };
  const parsed = LoginSchema.safeParse({ ...raw, next: formData.get("next") ?? undefined });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: { phone: raw.phone } };
  }
  const { phone, pin, next } = parsed.data;

  const limitKey = `login:${phone}|${await clientIp()}`;
  const limit = rateLimit(limitKey, MAX_ATTEMPTS, WINDOW_MS);
  // Backstop so a 4-digit PIN can't be brute-forced by rotating IPs.
  const phoneLimit = rateLimit(`login:${phone}`, MAX_ATTEMPTS_PER_PHONE, WINDOW_MS);
  if (!limit.allowed || !phoneLimit.allowed) {
    const minutes = Math.ceil(Math.max(limit.retryAfterSec, phoneLimit.retryAfterSec) / 60);
    return {
      error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      values: { phone: raw.phone },
    };
  }

  const agent = await db.agent.findUnique({ where: { phone }, select: { id: true, role: true, pinHash: true, active: true } });
  const ok = await bcrypt.compare(pin, agent?.pinHash ?? (await dummyHash));
  // Deactivated agents get the same generic error as a wrong PIN.
  if (!agent || !ok || !agent.active) return { error: GENERIC_ERROR, values: { phone: raw.phone } };

  resetRateLimit(limitKey);
  resetRateLimit(`login:${phone}`);
  const session = await getSession();
  session.agentId = agent.id;
  session.role = agent.role;
  await session.save();
  redirect(safeNext(next));
}
