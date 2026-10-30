"use client";

import Link from "next/link";

// Shown if loading a lot fails (e.g. database unavailable). Never shows technical details.
export default function VerifyError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 text-center">
      <h1 className="text-2xl font-bold">We couldn’t load this lot right now</h1>
      <p className="mt-2 text-ink/70">Please check your connection and try again in a moment.</p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="h-12 rounded-xl bg-brand px-5 font-semibold text-cream">
          Try again
        </button>
        <Link href="/verify" className="flex h-12 items-center rounded-xl px-5 font-semibold text-brand ring-1 ring-brand/30">
          Enter a code
        </Link>
      </div>
    </main>
  );
}
