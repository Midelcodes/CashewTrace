"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { AgentIdSchema, NewAgentSchema, ResetPinSchema } from "@/lib/schemas";

export type AgentFormState = FormState & { done?: string };

const audit = (adminId: string, action: string, agentId: string, detail?: string) =>
  db.auditLog.create({ data: { agentId: adminId, action, entity: "Agent", entityId: agentId, detail } });

export async function createAgentAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const admin = await requireAdmin();
  const values = formValues(formData);
  const parsed = NewAgentSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  const { pin, ...data } = parsed.data;

  const [hub, existing] = await Promise.all([
    db.hub.findUnique({ where: { id: data.hubId }, select: { id: true } }),
    db.agent.findUnique({ where: { phone: data.phone }, select: { id: true } }),
  ]);
  if (!hub) return { fieldErrors: { hubId: ["Choose a hub"] }, values };
  if (existing) return { fieldErrors: { phone: ["An agent with this phone number already exists"] }, values };

  const agent = await db.agent.create({ data: { ...data, role: "AGENT", pinHash: await bcrypt.hash(pin, 10) } });
  await audit(admin.id, "CREATE", agent.id, `${agent.name} · ${agent.phone}`);
  revalidatePath("/hub/agents");
  return { done: `${agent.name} added. Share the PIN with them in person.` };
}

export async function resetPinAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const admin = await requireAdmin();
  const parsed = ResetPinSchema.safeParse(formValues(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const agent = await db.agent.findUnique({ where: { id: parsed.data.agentId }, select: { id: true, name: true } });
  if (!agent) return { error: "Agent not found." };
  await db.agent.update({ where: { id: agent.id }, data: { pinHash: await bcrypt.hash(parsed.data.pin, 10) } });
  await audit(admin.id, "RESET_PIN", agent.id);
  return { done: `PIN reset for ${agent.name}.` };
}

/** Deactivate or reactivate. Deactivated agents can't sign in and lose access on their next request. */
export async function toggleAgentActiveAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = AgentIdSchema.safeParse(formValues(formData));
  if (!parsed.success || parsed.data.agentId === admin.id) return; // never lock yourself out

  const agent = await db.agent.findUnique({ where: { id: parsed.data.agentId }, select: { id: true, active: true } });
  if (!agent) return;
  await db.agent.update({ where: { id: agent.id }, data: { active: !agent.active } });
  await audit(admin.id, agent.active ? "DEACTIVATE" : "REACTIVATE", agent.id);
  revalidatePath("/hub/agents");
}
