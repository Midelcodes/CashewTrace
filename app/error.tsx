"use client";

// Friendly 500 page. Never shows technical details; `digest` lets us match the server log.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold text-brand">Sorry, this page didn’t load</h1>
      <p className="mt-2 text-ink/70">
        It’s not you. Please try again in a moment. If it keeps happening, tell the CashewTrace team
        {error.digest ? (
          <>
            {" "}and quote reference <span className="font-mono text-ink">{error.digest}</span>
          </>
        ) : null}
        .
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={reset} className="h-12 rounded-xl bg-brand px-5 font-semibold text-cream hover:bg-brand-dark">
          Try again
        </button>
        {/* Full page load on purpose: the app state may be broken. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="flex h-12 items-center rounded-xl px-5 font-semibold text-brand ring-1 ring-brand/30">
          Go to home page
        </a>
      </div>
    </main>
  );
}
