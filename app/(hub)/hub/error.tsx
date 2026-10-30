"use client";

import Link from "next/link";

// Hub-scoped error: keeps the hub navigation so the agent can carry on with other work.
export default function HubError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="text-2xl font-bold">This screen didn’t load</h1>
      <p className="mt-2 text-ink/70">
        Check your connection and try again. Nothing you saved before this has been lost.
        {error.digest && (
          <span className="mt-1 block text-xs">
            Reference: <span className="font-mono">{error.digest}</span>
          </span>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={reset} className="h-12 rounded-xl bg-brand px-5 font-semibold text-cream hover:bg-brand-dark">
          Try again
        </button>
        <Link href="/hub" className="flex h-12 items-center rounded-xl px-5 font-semibold text-brand ring-1 ring-brand/30">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
