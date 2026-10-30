"use client";

import { useActionState, useState } from "react";
import { Field, FormError, inputClass } from "@/components/ui/form";
import { MONTHS } from "@/lib/format";
import type { FormState } from "@/lib/forms";
import { createLotAction } from "../actions";

const STANDARD_BAG_KG = 80;
const TOLERANCE_KG = 10; // warn outside 70–90 kg per bag

export function NewLotForm({ farmerId, today }: { farmerId: string; today: { year: number; month: number } }) {
  const [form, action, pending] = useActionState<FormState, FormData>(createLotAction, {});
  const v = form.values ?? {};
  const err = form.fieldErrors ?? {};
  const [bags, setBags] = useState(v.bags ?? "");
  const [weight, setWeight] = useState(v.weightKg ?? "");

  const perBag = Number(bags) > 0 && Number(weight) > 0 ? Number(weight) / Number(bags) : null;
  const offStandard = perBag !== null && Math.abs(perBag - STANDARD_BAG_KG) > TOLERANCE_KG;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="farmerId" value={farmerId} />
      <FormError message={form.error} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Bags" error={err.bags}>
          <input
            name="bags"
            type="number"
            inputMode="numeric"
            min="1"
            value={bags}
            onChange={(e) => setBags(e.target.value)}
            aria-invalid={!!err.bags}
            className={`${inputClass} text-lg font-semibold`}
          />
        </Field>
        <Field label="Total weight (kg)" error={err.weightKg}>
          <input
            name="weightKg"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            aria-invalid={!!err.weightKg}
            className={`${inputClass} text-lg font-semibold`}
          />
        </Field>
      </div>

      {perBag !== null && (
        <p
          role={offStandard ? "alert" : "status"}
          className={`-mt-2 rounded-xl px-4 py-3 text-sm ${
            offStandard ? "bg-amber-50 font-medium text-amber-900 ring-1 ring-amber-300" : "bg-brand-light/60 text-brand"
          }`}
        >
          {offStandard ? "⚠ " : ""}
          {perBag.toFixed(1)} kg per bag
          {offStandard
            ? ` — far from the standard ${STANDARD_BAG_KG} kg bag. Check the bag count and the scale reading.`
            : ` · standard bag is ${STANDARD_BAG_KG} kg`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Harvest month" error={err.harvestMonth}>
          <select name="harvestMonth" defaultValue={v.harvestMonth ?? String(today.month)} className={inputClass}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Season" error={err.season}>
          <select name="season" defaultValue={v.season ?? String(today.year)} className={inputClass}>
            {[today.year, today.year - 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-xl bg-accent-dark text-base font-semibold text-white transition hover:bg-accent-darker disabled:opacity-60"
      >
        {pending ? "Saving…" : "Receive lot"}
      </button>
      <p className="-mt-2 text-center text-xs text-ink/70">Creates the lot as Received with a new lot code.</p>
    </form>
  );
}
