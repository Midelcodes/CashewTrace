"use client";

import { useActionState, useState } from "react";
import { GRADE_STYLE } from "@/components/ui/badges";
import { Field, FormError, inputClass } from "@/components/ui/form";
import type { FormState } from "@/lib/forms";
import { gradeLot, type GradingThresholds } from "@/lib/grading";
import { calculateSale, formatNaira, type FeeSettings } from "@/lib/money";
import { listLotAction, qualityTestAction, recordSaleAction, rejectLotAction, startDryingAction } from "../actions";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function useLotForm(action: Action) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  return { state, formAction, pending, v: state.values ?? {}, err: state.fieldErrors ?? {} };
}

function Submit({ pending, children, tone = "brand" }: { pending: boolean; children: string; tone?: "brand" | "accent" | "danger" }) {
  const colors = {
    brand: "bg-brand hover:bg-brand-dark text-cream",
    accent: "bg-accent-dark hover:bg-accent-darker text-white",
    danger: "bg-red-700 hover:bg-red-800 text-white",
  }[tone];
  return (
    <button type="submit" disabled={pending} className={`h-14 w-full rounded-xl text-base font-semibold transition disabled:opacity-60 ${colors}`}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function StartDryingForm({ lotId }: { lotId: string }) {
  const { state, formAction, pending, v, err } = useLotForm(startDryingAction);
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lotId" value={lotId} />
      <FormError message={state.error} />
      <Field label="Moisture before drying (%)" error={err.moistureBefore} hint="Moisture meter reading at intake, e.g. 14.5">
        <input name="moistureBefore" type="number" inputMode="decimal" step="0.1" defaultValue={v.moistureBefore} aria-invalid={!!err.moistureBefore} className={`${inputClass} text-lg font-semibold`} />
      </Field>
      <Submit pending={pending}>☀ Start solar drying</Submit>
    </form>
  );
}

export function QualityTestForm({
  lotId,
  defaultDryingDays,
  thresholds,
}: {
  lotId: string;
  defaultDryingDays: number;
  thresholds: GradingThresholds;
}) {
  const { state, formAction, pending, v, err } = useLotForm(qualityTestAction);
  const [moisture, setMoisture] = useState(v.moistureAfter ?? "");
  const [kor, setKor] = useState(v.korLbs ?? "");
  const preview =
    moisture !== "" && kor !== "" && Number.isFinite(Number(moisture)) && Number.isFinite(Number(kor))
      ? gradeLot({ moistureAfter: Number(moisture), korLbs: Number(kor) }, thresholds)
      : null;
  const tooWet = preview === "FAIL" && Number(moisture) > thresholds.moistureMaxPct;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lotId" value={lotId} />
      <FormError message={state.error} />
      {state.warning && (
        <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-300">
          ☀ {state.warning}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Moisture after (%)" error={err.moistureAfter}>
          <input name="moistureAfter" type="number" inputMode="decimal" step="0.1" value={moisture} onChange={(e) => setMoisture(e.target.value)} aria-invalid={!!err.moistureAfter} className={`${inputClass} text-lg font-semibold`} />
        </Field>
        <Field label="KOR (lbs / 80 kg)" error={err.korLbs}>
          <input name="korLbs" type="number" inputMode="decimal" step="0.1" value={kor} onChange={(e) => setKor(e.target.value)} aria-invalid={!!err.korLbs} className={`${inputClass} text-lg font-semibold`} />
        </Field>
        <Field label="Nut count / kg" error={err.nutCountPerKg} hint="Optional">
          <input name="nutCountPerKg" type="number" inputMode="numeric" defaultValue={v.nutCountPerKg} aria-invalid={!!err.nutCountPerKg} className={inputClass} />
        </Field>
        <Field label="Defective (%)" error={err.defectivePct} hint="Optional">
          <input name="defectivePct" type="number" inputMode="decimal" step="0.1" defaultValue={v.defectivePct} aria-invalid={!!err.defectivePct} className={inputClass} />
        </Field>
        <Field label="Drying days" error={err.dryingDays}>
          <input name="dryingDays" type="number" inputMode="numeric" defaultValue={v.dryingDays ?? defaultDryingDays} aria-invalid={!!err.dryingDays} className={inputClass} />
        </Field>
      </div>

      <div className={`rounded-xl px-4 py-3 text-sm ${preview ? GRADE_STYLE[preview] : "bg-black/5 text-ink/70"}`} aria-live="polite">
        {preview ? (
          <>
            <span className="font-bold">Expected: {preview === "FAIL" ? "Fail" : `Grade ${preview}`}</span>
            {tooWet && ", too wet, keep drying"}
          </>
        ) : (
          "Enter moisture and KOR to preview the grade"
        )}
        <span className="mt-1 block text-xs">
          Max moisture {thresholds.moistureMaxPct}% · A ≥ {thresholds.gradeA_minKor} · B ≥ {thresholds.gradeB_minKor} · C ≥ {thresholds.gradeC_minKor} lbs
        </span>
      </div>

      <Submit pending={pending}>Save test &amp; grade lot</Submit>
    </form>
  );
}

export function ListForm({ lotId }: { lotId: string }) {
  const { state, formAction, pending } = useLotForm(listLotAction);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="lotId" value={lotId} />
      <FormError message={state.error} />
      <Submit pending={pending} tone="accent">List for sale</Submit>
    </form>
  );
}

export function SaleForm({
  lotId,
  weightKg,
  bags,
  defaultPrice,
  fees,
}: {
  lotId: string;
  weightKg: number;
  bags: number;
  defaultPrice: number;
  fees: FeeSettings;
}) {
  const { state, formAction, pending, v, err } = useLotForm(recordSaleAction);
  const [price, setPrice] = useState(v.pricePerTonneNgn ?? String(defaultPrice));
  const priceNum = Number(price);
  const preview = priceNum > 0 ? calculateSale({ weightKg, bags, pricePerTonneNgn: priceNum }, fees) : null;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="lotId" value={lotId} />
      <FormError message={state.error} />
      <Field label="Buyer name" error={err.buyerName}>
        <input name="buyerName" defaultValue={v.buyerName} aria-invalid={!!err.buyerName} className={inputClass} />
      </Field>
      <Field label="Price per tonne (₦)" error={err.pricePerTonneNgn} hint="Prefilled from Settings. Use the agreed price">
        <input name="pricePerTonneNgn" type="number" inputMode="numeric" step="1000" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!err.pricePerTonneNgn} className={`${inputClass} text-lg font-semibold`} />
      </Field>
      {preview && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl bg-cream p-4 text-sm">
          <dt className="text-ink/70">Lot value</dt>
          <dd className="text-right font-medium">{formatNaira(preview.totalValueNgn)}</dd>
          <dt className="text-ink/70">Farmer fees</dt>
          <dd className="text-right font-medium">− {formatNaira(preview.farmerFeesNgn)}</dd>
          <dt className="font-semibold">Farmer payout</dt>
          <dd className="text-right text-base font-bold text-brand">{formatNaira(preview.farmerPayoutNgn)}</dd>
          <dt className="text-ink/70">Commission (buyer pays)</dt>
          <dd className="text-right font-medium">{formatNaira(preview.commissionNgn)}</dd>
        </dl>
      )}
      <Submit pending={pending} tone="accent">Record sale</Submit>
    </form>
  );
}

const REJECT_REASONS = [
  "KOR below minimum, returned to farmer",
  "Mould or insect damage",
  "Foreign matter / adulteration",
  "Farmer withdrew the lot",
];

export function RejectForm({ lotId, open = false }: { lotId: string; open?: boolean }) {
  const { state, formAction, pending, v, err } = useLotForm(rejectLotAction);
  return (
    <details open={open || !!state.fieldErrors || !!state.error} className="group rounded-2xl bg-white ring-1 ring-black/5">
      <summary className="flex h-12 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-red-700">
        Reject this lot
        <span className="transition group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <form action={formAction} className="flex flex-col gap-3 px-4 pb-4" noValidate>
        <input type="hidden" name="lotId" value={lotId} />
        <FormError message={state.error} />
        <Field label="Reason" error={err.reason}>
          <input name="reason" list="reject-reasons" defaultValue={v.reason} aria-invalid={!!err.reason} className={inputClass} />
          <datalist id="reject-reasons">
            {REJECT_REASONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </Field>
        <Submit pending={pending} tone="danger">Reject lot</Submit>
      </form>
    </details>
  );
}
