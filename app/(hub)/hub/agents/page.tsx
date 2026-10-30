import { PageHeader } from "@/components/hub/PageHeader";
import { Avatar, CountBadge } from "@/components/ui/badges";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { toggleAgentActiveAction } from "./actions";
import { NewAgentForm, ResetPinForm } from "./AgentForms";

export default async function AgentsPage() {
  const admin = await requireAdmin();
  const [agents, hubs] = await Promise.all([
    db.agent.findMany({
      orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
      include: { hub: { select: { name: true, code: true } }, _count: { select: { lots: true } } },
    }),
    db.hub.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const active = agents.filter((a) => a.active && a.role === "AGENT");
  const inclusive = active.filter((a) => a.gender === "FEMALE" || a.isYouth).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="Agents"
        badge={<CountBadge count={agents.length} />}
        description={`${inclusive} of ${active.length} active field agents are women or youth`}
      />

      <ul className="flex flex-col gap-3">
        {agents.map((a) => {
          const self = a.id === admin.id;
          return (
            <li key={a.id} className={`rounded-2xl bg-white p-4 ring-1 ring-black/5 ${a.active ? "" : "opacity-75"}`}>
              <div className="flex items-start gap-3">
                <Avatar name={a.name} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {a.name}
                    {a.role === "ADMIN" && <Tag className="bg-accent/15 text-accent-darker">Admin</Tag>}
                    {!a.active && <Tag className="bg-black/10 text-ink">Deactivated</Tag>}
                  </p>
                  <p className="text-sm text-ink/70">
                    {formatPhone(a.phone)} · {a.hub.name}
                  </p>
                  <p className="text-xs text-ink/70">
                    {a.gender === "FEMALE" ? "Woman" : "Man"}
                    {a.isYouth && " · youth"} · {a._count.lots} lots received · since {formatDate(a.createdAt)}
                  </p>
                </div>
              </div>
              <details className="mt-3 border-t border-black/5 pt-3">
                <summary className="cursor-pointer text-sm font-semibold text-brand">Manage</summary>
                <div className="mt-3 flex flex-col gap-4">
                  <ResetPinForm agentId={a.id} name={a.name.split(" ")[0]} />
                  {self ? (
                    <p className="text-xs text-ink/70">You can’t deactivate your own account.</p>
                  ) : (
                    <form action={toggleAgentActiveAction}>
                      <input type="hidden" name="agentId" value={a.id} />
                      <button
                        type="submit"
                        className={`h-11 rounded-xl px-4 text-sm font-semibold ${
                          a.active ? "text-red-800 ring-1 ring-red-300 hover:bg-red-50" : "bg-brand text-cream hover:bg-brand-dark"
                        }`}
                      >
                        {a.active ? "Deactivate agent" : "Reactivate agent"}
                      </button>
                      {a.active && (
                        <p className="mt-1 text-xs text-ink/70">They can’t sign in until reactivated. Their records are kept.</p>
                      )}
                    </form>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="mb-4 text-lg font-bold">Add an agent</h2>
        <NewAgentForm hubs={hubs} />
      </section>
    </div>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}
