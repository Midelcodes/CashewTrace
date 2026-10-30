import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader, VerifyBox } from "@/components/public/SiteChrome";

export const metadata: Metadata = { title: "Page not found · CashewTrace", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">404</p>
        <h1 className="mt-2 text-3xl font-bold text-brand">We couldn’t find that page</h1>
        <p className="mt-2 text-ink/70">
          The link may be old or mistyped. If you’re checking a bag of cashew, enter its lot code below.
        </p>
        <div className="mt-6">
          <VerifyBox />
        </div>
        <ul className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <li>
            <Link href="/" className="flex h-11 items-center rounded-xl px-4 text-brand ring-1 ring-brand/30">
              Home
            </Link>
          </li>
          <li>
            <Link href="/lots" className="flex h-11 items-center rounded-xl px-4 text-brand ring-1 ring-brand/30">
              Available lots
            </Link>
          </li>
          <li>
            <Link href="/hub" className="flex h-11 items-center rounded-xl px-4 text-brand ring-1 ring-brand/30">
              Hub agents
            </Link>
          </li>
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
