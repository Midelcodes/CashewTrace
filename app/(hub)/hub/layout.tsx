import Link from "next/link";
import { BottomTabs, SidebarNav } from "@/components/hub/HubNav";
import { LogoutIcon } from "@/components/icons";
import { requireAgent } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  const isAdmin = agent.role === "ADMIN";

  return (
    <div className="flex flex-1">
      {/* Desktop sidebar */}
      <aside className="sticky top-7 hidden h-[calc(100dvh-1.75rem)] w-60 shrink-0 flex-col bg-brand px-4 py-6 md:flex print:hidden">
        <Link href="/hub" className="mb-8 px-3 text-xl font-bold text-white">
          Cashew<span className="text-accent">Trace</span>
        </Link>
        <SidebarNav isAdmin={isAdmin} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-7 z-30 flex h-14 items-center justify-between gap-3 border-b border-black/10 bg-white px-4 print:hidden">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold leading-tight text-brand">{agent.hub.name}</p>
            <p className="truncate text-xs text-ink/70">
              {agent.name}
              {isAdmin && <span className="ml-1.5 rounded bg-accent/15 px-1.5 py-0.5 font-semibold text-accent-darker">Admin</span>}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-ink/70 transition hover:bg-black/5 hover:text-ink"
            >
              <LogoutIcon className="size-5" />
              <span>Log out</span>
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-10 print:p-0">{children}</main>
      </div>

      <BottomTabs />
    </div>
  );
}
