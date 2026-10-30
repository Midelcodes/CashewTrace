// Persistent honesty banner shown on every page (rendered from the root layout).
export function PrototypeBanner() {
  return (
    <div
      role="note"
      className="sticky top-0 z-50 w-full bg-ink px-4 py-1.5 text-center text-xs font-medium tracking-wide text-cream print:hidden"
    >
      Prototype · demo data
    </div>
  );
}
