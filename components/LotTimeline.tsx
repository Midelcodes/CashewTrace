import type { LotStatus } from "@prisma/client";
import { formatDateTime } from "@/lib/format";

export type TimelineEvent = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: Date;
  agentName?: string; // omitted on the public page
};

// Main milestones, in order. Other events (moisture checks, reserved, rejected) slot in by time.
const MILESTONES = [
  { action: "RECEIVED", label: "Received" },
  { action: "DRYING_STARTED", label: "Solar drying" },
  { action: "TESTED", label: "Tested & graded" },
  { action: "LISTED", label: "Listed for sale" },
  { action: "SOLD", label: "Sold" },
] as const;

const EXTRA_LABEL: Record<string, string> = {
  MOISTURE_CHECK: "Moisture check",
  RESERVED: "Reserved by buyer",
  REJECTED: "Rejected",
};

export function LotTimeline({ events, status }: { events: TimelineEvent[]; status: LotStatus }) {
  const sorted = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const reached = new Set(sorted.map((e) => e.action));
  const pending =
    status === "REJECTED" ? [] : MILESTONES.filter((m) => !reached.has(m.action));

  const label = (action: string) =>
    MILESTONES.find((m) => m.action === action)?.label ?? EXTRA_LABEL[action] ?? action;
  const tone = (action: string) =>
    action === "REJECTED" ? "bg-red-600" : action === "MOISTURE_CHECK" ? "bg-amber-500" : action === "RESERVED" ? "bg-accent" : "bg-brand";

  return (
    <ol className="relative flex flex-col">
      {sorted.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-5">
          {(i < sorted.length - 1 || pending.length > 0) && (
            <span aria-hidden="true" className="absolute top-6 left-[11px] h-full w-0.5 bg-brand/25" />
          )}
          <span className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${tone(e.action)}`}>
            {e.action === "REJECTED" ? "✕" : e.action === "MOISTURE_CHECK" ? "!" : "✓"}
          </span>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{label(e.action)}</p>
            <p className="text-xs text-ink/70">
              {formatDateTime(e.createdAt)}
              {e.agentName && ` · ${e.agentName}`}
            </p>
            {e.detail && <p className="mt-0.5 text-sm text-ink/80">{e.detail}</p>}
          </div>
        </li>
      ))}
      {pending.map((m, i) => (
        <li key={m.action} className="relative flex gap-3 pb-5 last:pb-0">
          {i < pending.length - 1 && <span aria-hidden="true" className="absolute top-6 left-[11px] h-full w-0.5 bg-black/10" />}
          <span className="relative z-10 mt-0.5 size-6 shrink-0 rounded-full border-2 border-black/15 bg-white" />
          <p className="font-medium leading-tight text-ink/70">{m.label}</p>
        </li>
      ))}
    </ol>
  );
}
