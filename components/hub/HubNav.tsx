"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { AgentsIcon, DashboardIcon, ExportIcon, FarmersIcon, LotsIcon, PlusIcon, SettingsIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: (path: string) => boolean;
};

const MAIN: NavItem[] = [
  { href: "/hub", label: "Dashboard", icon: DashboardIcon, isActive: (p) => p === "/hub" },
  { href: "/hub/farmers", label: "Farmers", icon: FarmersIcon, isActive: (p) => p.startsWith("/hub/farmers") },
  {
    href: "/hub/lots",
    label: "Lots",
    icon: LotsIcon,
    isActive: (p) => p.startsWith("/hub/lots") && p !== "/hub/lots/new",
  },
];

const NEW_LOT: NavItem = {
  href: "/hub/lots/new",
  label: "New lot",
  icon: PlusIcon,
  isActive: (p) => p === "/hub/lots/new",
};

const ADMIN: NavItem[] = [
  { href: "/hub/settings", label: "Settings", icon: SettingsIcon, isActive: (p) => p.startsWith("/hub/settings") },
  { href: "/hub/agents", label: "Agents", icon: AgentsIcon, isActive: (p) => p.startsWith("/hub/agents") },
  { href: "/hub/exports", label: "Exports", icon: ExportIcon, isActive: (p) => p.startsWith("/hub/exports") },
];

/** Desktop left sidebar. */
export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const link = (item: NavItem) => {
    const active = item.isActive(path);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
          active ? "bg-white/15 text-white" : "text-cream/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon className="size-5 shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-1" aria-label="Hub">
      {MAIN.map(link)}
      <Link
        href={NEW_LOT.href}
        aria-current={NEW_LOT.isActive(path) ? "page" : undefined}
        className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-accent-dark text-sm font-semibold text-white shadow-sm transition hover:bg-accent-darker"
      >
        <PlusIcon className="size-5" />
        New lot
      </Link>
      {isAdmin && (
        <>
          <p className="mt-6 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-cream/80">Admin</p>
          {ADMIN.map(link)}
        </>
      )}
    </nav>
  );
}

/** Mobile bottom tab bar: Dashboard, Farmers, Lots + a prominent New lot button. */
export function BottomTabs() {
  const path = usePathname();
  return (
    <nav
      aria-label="Hub"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
    >
      <ul className="grid grid-cols-4">
        {MAIN.map((item) => {
          const active = item.isActive(path);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? "text-brand" : "text-ink/70"
                }`}
              >
                <Icon className="size-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex items-center justify-center">
          <Link
            href={NEW_LOT.href}
            aria-current={NEW_LOT.isActive(path) ? "page" : undefined}
            className="-mt-6 flex size-16 flex-col items-center justify-center rounded-2xl bg-accent-dark text-[11px] font-semibold text-white shadow-lg ring-4 ring-cream transition active:scale-95"
          >
            <PlusIcon className="size-7" />
            New lot
          </Link>
        </li>
      </ul>
    </nav>
  );
}
