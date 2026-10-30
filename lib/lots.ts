import "server-only";
import type { LotStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatLotCode, stateCode } from "@/lib/ids";

/** Lifecycle actions recorded in AuditLog (entity "Lot") and shown on the lot timeline. */
export type LotEvent =
  | "RECEIVED"
  | "DRYING_STARTED"
  | "MOISTURE_CHECK"
  | "TESTED"
  | "LISTED"
  | "RESERVED"
  | "SOLD"
  | "REJECTED";

/** Statuses a lot can still be rejected from. */
export const REJECTABLE: LotStatus[] = ["RECEIVED", "DRYING", "TESTED", "LISTED", "RESERVED"];

/** Next CT-KOG-2026-000123 code for that state + season. Zero-padded, so string order = numeric order. */
export async function nextLotCode(state: string, season: number): Promise<string> {
  const prefix = `CT-${stateCode(state)}-${season}-`;
  const last = await db.lot.findFirst({
    where: { lotCode: { startsWith: prefix } },
    orderBy: { lotCode: "desc" },
    select: { lotCode: true },
  });
  const n = last ? Number(last.lotCode.slice(prefix.length)) : 0;
  return formatLotCode(state, season, n + 1);
}

export class LotStateError extends Error {}

/**
 * Move a lot to a new status, but only if it is still in one of `from` (and inside the agent's
 * scope) - guards against double taps and stale screens. Writes the audit entry in the same transaction.
 */
export async function transitionLot(
  tx: Prisma.TransactionClient,
  opts: {
    where: Prisma.LotWhereInput & { id: string };
    from: LotStatus[];
    data: Prisma.LotUpdateManyMutationInput;
    agentId: string;
    event: LotEvent;
    detail?: string;
  },
) {
  const res = await tx.lot.updateMany({
    where: { ...opts.where, status: { in: opts.from } },
    data: opts.data,
  });
  if (res.count !== 1) throw new LotStateError("This lot has already moved on. Refresh the page.");
  await logLotEvent(tx, opts.where.id, opts.agentId, opts.event, opts.detail);
}

export function logLotEvent(
  tx: Prisma.TransactionClient,
  lotId: string,
  agentId: string,
  event: LotEvent,
  detail?: string,
) {
  return tx.auditLog.create({ data: { agentId, action: event, entity: "Lot", entityId: lotId, detail } });
}
