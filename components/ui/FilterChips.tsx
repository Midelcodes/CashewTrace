import Link from "next/link";

/** Horizontal row of link chips; works without JS and scrolls sideways on small screens. */
export function FilterChips({
  label,
  options,
  active,
  href,
}: {
  label: string;
  options: readonly { value: string; label: string; count?: number }[];
  active: string;
  href: (value: string) => string;
}) {
  return (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label={label}>
      {options.map((o) => {
        const on = o.value === active;
        return (
          <Link
            key={o.value}
            href={href(o.value)}
            aria-current={on ? "true" : undefined}
            className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${
              on ? "bg-brand text-cream" : "bg-white text-ink/80 ring-1 ring-black/10 hover:ring-brand/40"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={on ? "text-cream/70" : "text-ink/70"}>{o.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}
