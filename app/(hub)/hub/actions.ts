"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function logoutAction() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

const ToggleSchema = z.object({ interestId: z.string().min(1) });

/** Flip a buyer enquiry between contacted / not contacted (own hub only, admins any hub). */
export async function toggleContactedAction(formData: FormData) {
  const agent = await requireAgent();
  const parsed = ToggleSchema.safeParse({ interestId: formData.get("interestId") });
  if (!parsed.success) return;

  const interest = await db.buyerInterest.findFirst({
    where: { id: parsed.data.interestId, ...(agent.role === "ADMIN" ? {} : { lot: { hubId: agent.hubId } }) },
    select: { id: true, contactedAt: true, lotId: true },
  });
  if (!interest) return;

  const contacted = !interest.contactedAt;
  await db.$transaction([
    db.buyerInterest.update({ where: { id: interest.id }, data: { contactedAt: contacted ? new Date() : null } }),
    db.auditLog.create({
      data: { agentId: agent.id, action: contacted ? "CONTACTED" : "UNCONTACTED", entity: "BuyerInterest", entityId: interest.id },
    }),
  ]);
  revalidatePath("/hub");
  revalidatePath(`/hub/lots/${interest.lotId}`);
}
