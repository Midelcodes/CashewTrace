import "server-only";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Authoritative auth checks. proxy.ts only does a fast cookie check; every hub page and
// server action must still call one of these, which also confirms the agent exists in the DB.

export async function getCurrentAgent() {
  const session = await getSession();
  if (!session.agentId) return null;
  // Deactivated agents lose access on their next request, even with a valid cookie.
  return db.agent.findFirst({
    where: { id: session.agentId, active: true },
    select: { id: true, name: true, role: true, hubId: true, hub: { select: { name: true, code: true } } },
  });
}

export type CurrentAgent = NonNullable<Awaited<ReturnType<typeof getCurrentAgent>>>;

export async function requireAgent(): Promise<CurrentAgent> {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/login");
  return agent;
}

/** Prisma `where` fragment: agents see their own hub's records, admins see every hub. */
export function hubScope(agent: CurrentAgent): { hubId?: string } {
  return agent.role === "ADMIN" ? {} : { hubId: agent.hubId };
}

export async function requireAdmin(): Promise<CurrentAgent> {
  const agent = await requireAgent();
  if (agent.role !== "ADMIN") redirect("/hub");
  return agent;
}
