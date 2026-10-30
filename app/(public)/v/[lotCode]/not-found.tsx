// No loading.tsx for this route on purpose: a streamed response can no longer send a 404 status for bad codes.
import { SiteFooter, SiteHeader, VerifyBox } from "@/components/public/SiteChrome";

export default function LotNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4">
        <section className="-mx-4 bg-red-700 px-4 py-6 text-white sm:mx-0 sm:mt-4 sm:rounded-2xl sm:px-6">
          <p className="flex items-center gap-3 text-2xl font-bold sm:text-3xl">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-red-700">
              ✕
            </span>
            Lot not found
          </p>
          <p className="mt-2 text-sm text-white/90">
            This code doesn’t match any CashewTrace lot. Labels without a matching record should not be trusted.
          </p>
        </section>
        <section className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="text-lg font-bold">Check the code</h2>
          <p className="mt-1 mb-4 text-sm text-ink/70">
            Type the lot code printed under the QR code, e.g. <span className="font-mono">CT-KOG-2026-000046</span>.
          </p>
          <VerifyBox />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
