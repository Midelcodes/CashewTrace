"use server";

import { redirect } from "next/navigation";
import { requireAgent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { FarmerSchema } from "@/lib/schemas";
import { nextFarmerCode, withUniqueRetry } from "@/lib/sequences";

export async function createFarmerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const agent = await requireAgent();

  const values = formValues(formData);
  const parsed = FarmerSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const data = parsed.data;

  // Shared family phones are common, so only block the same name + phone in the same hub.
  const duplicate = await db.farmer.findFirst({
    where: { hubId: agent.hubId, phone: data.phone, fullName: { equals: data.fullName, mode: "insensitive" } },
    select: { farmerCode: true },
  });
  if (duplicate) {
    return { error: `${data.fullName} is already registered as ${duplicate.farmerCode}.`, values };
  }

  const farmer = await withUniqueRetry(async () => {
    const farmerCode = await nextFarmerCode();
    return db.$transaction(async (tx) => {
      const created = await tx.farmer.create({ data: { ...data, farmerCode, hubId: agent.hubId } });
      await tx.auditLog.create({
        data: { agentId: agent.id, action: "CREATE", entity: "Farmer", entityId: created.id },
      });
      return created;
    });
  });

  redirect(`/hub/farmers/${farmer.id}?created=1`);
}
