import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader, VerifyBox } from "@/components/public/SiteChrome";
import { normalizeLotCode } from "@/lib/public-lot";

export const metadata: Metadata = {
  title: "Verify a cashew lot · CashewTrace",
  description: "Enter a CashewTrace lot code to see its origin, quality test results and chain of custody.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const raw = code?.trim() ?? "";
  const normalised = raw ? normalizeLotCode(raw) : null;
  if (normalised) redirect(`/v/${normalised}`);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold text-brand">Verify a cashew lot</h1>
        <p className="mt-2 text-ink/70">
          Enter the lot code printed under the QR code on the bag label, or scan the QR code with your phone camera.
        </p>
        <div className="mt-6">
          <VerifyBox defaultValue={raw} autoFocus />
        </div>
        {raw && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            “{raw.slice(0, 60)}” doesn’t look like a lot code. Codes look like <span className="font-mono">CT-KOG-2026-000046</span>.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
