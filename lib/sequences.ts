import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatFarmerCode } from "@/lib/ids";

/** Next CTF-000123 code. Codes are zero-padded, so string order = numeric order. */
export async function nextFarmerCode(): Promise<string> {
  const last = await db.farmer.findFirst({ orderBy: { farmerCode: "desc" }, select: { farmerCode: true } });
  const n = last ? Number(last.farmerCode.replace(/\D/g, "")) : 0;
  return formatFarmerCode(n + 1);
}

/** Retries `fn` when two agents grab the same sequence number at once (unique violation). */
export async function withUniqueRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const unique = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!unique || i >= attempts) throw e;
    }
  }
}
