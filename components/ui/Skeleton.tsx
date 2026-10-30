// Loading placeholders. Pulse only when the user hasn't asked for reduced motion.

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`rounded-xl bg-black/[0.07] motion-safe:animate-pulse ${className}`} />;
}

export function LoadingScreen({ variant = "list", label = "Loading…" }: { variant?: "list" | "cards" | "detail"; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      {variant === "cards" && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}
      {variant === "list" && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}
      {variant === "detail" && (
        <>
          <Skeleton className="h-28" />
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </>
      )}
    </div>
  );
}
