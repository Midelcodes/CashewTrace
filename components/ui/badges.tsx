import type { Grade, LotStatus } from "@prisma/client";
import { initials } from "@/lib/ids";

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const letters = initials(name).replace(/\./g, "").slice(0, 2);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand ${
        size === "lg" ? "size-16 text-xl" : "size-11 text-sm"
      }`}
    >
      {letters}
    </span>
  );
}

// A green, B teal, C amber, FAIL red - validated as a CVD-safe set (dataviz palette check).
// B and C carry dark text so small badge text keeps contrast.
export const GRADE_HEX: Record<Grade, string> = { A: "#15803d", B: "#0891b2", C: "#ca8a04", FAIL: "#dc2626" };
export const GRADE_STYLE: Record<Grade, string> = {
  A: "bg-green-700 text-white",
  B: "bg-cyan-600 text-ink",
  C: "bg-yellow-600 text-ink",
  FAIL: "bg-red-600 text-white",
};

const GRADE_NOTE: Record<Grade, string> = {
  A: "Premium export quality",
  B: "Good export quality",
  C: "Standard / local processing",
  FAIL: "Below minimum quality",
};

export function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <span className={`inline-flex min-w-8 justify-center rounded-md px-1.5 py-0.5 text-xs font-bold ${GRADE_STYLE[grade]}`}>
      {grade === "FAIL" ? "Fail" : `Grade ${grade}`}
    </span>
  );
}

/** Large grade display for the lot page. */
export function GradeHero({ grade, kor }: { grade: Grade; kor: number }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl p-4 ${GRADE_STYLE[grade]}`}>
      <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-5xl font-black">
        {grade === "FAIL" ? "✕" : grade}
      </span>
      <div>
        <p className="text-2xl font-bold">{grade === "FAIL" ? "Fail" : `Grade ${grade}`}</p>
        <p className="text-sm">{GRADE_NOTE[grade]}</p>
        <p className="mt-1 text-sm font-semibold">KOR {kor.toFixed(1)} lbs / 80 kg bag</p>
      </div>
    </div>
  );
}

export const STATUS_LABEL: Record<LotStatus, string> = {
  RECEIVED: "Received",
  DRYING: "Drying",
  TESTED: "Tested",
  LISTED: "Listed",
  RESERVED: "Reserved",
  SOLD: "Sold",
  REJECTED: "Rejected",
};

const STATUS_STYLE: Record<LotStatus, string> = {
  RECEIVED: "bg-slate-100 text-slate-700",
  DRYING: "bg-amber-50 text-amber-800",
  TESTED: "bg-sky-50 text-sky-800",
  LISTED: "bg-emerald-50 text-emerald-800",
  RESERVED: "bg-accent/15 text-accent-darker",
  SOLD: "bg-brand-light text-brand",
  REJECTED: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-7 justify-center rounded-full bg-brand-light px-2 py-0.5 text-sm font-semibold text-brand">
      {count}
    </span>
  );
}
