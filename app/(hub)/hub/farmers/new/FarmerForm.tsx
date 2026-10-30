"use client";

import { useActionState } from "react";
import { Field, FormError, Segmented, inputClass } from "@/components/ui/form";
import type { FormState } from "@/lib/forms";
import { createFarmerAction } from "../actions";

export function FarmerForm({ lga, state, communities }: { lga: string; state: string; communities: string[] }) {
  const [form, action, pending] = useActionState<FormState, FormData>(createFarmerAction, {});
  const v = form.values ?? {};
  const err = form.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormError message={form.error} />

      <Field label="Full name" error={err.fullName}>
        <input name="fullName" autoComplete="off" defaultValue={v.fullName} aria-invalid={!!err.fullName} className={inputClass} />
      </Field>

      <Field label="Phone number" error={err.phone} hint="0803 123 4567 or +234 803 123 4567">
        <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} aria-invalid={!!err.phone} className={inputClass} />
      </Field>

      <Segmented
        name="gender"
        label="Gender"
        defaultValue={v.gender}
        error={err.gender}
        options={[
          { value: "FEMALE", label: "Female" },
          { value: "MALE", label: "Male" },
        ]}
      />

      <Segmented
        name="ageGroup"
        label="Age group"
        defaultValue={v.ageGroup}
        error={err.ageGroup}
        options={[
          { value: "YOUTH_18_35", label: "18–35 (youth)" },
          { value: "ADULT_36_PLUS", label: "36 and over" },
        ]}
      />

      <Field label="Community" error={err.community}>
        <input
          name="community"
          list="communities"
          autoComplete="off"
          defaultValue={v.community}
          aria-invalid={!!err.community}
          className={inputClass}
        />
        <datalist id="communities">
          {communities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="LGA" error={err.lga}>
          <input name="lga" defaultValue={v.lga ?? lga} aria-invalid={!!err.lga} className={inputClass} />
        </Field>
        <Field label="State" error={err.state}>
          <input name="state" defaultValue={v.state ?? state} aria-invalid={!!err.state} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Farm size (ha)" error={err.farmSizeHa}>
          <input
            name="farmSizeHa"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0.1"
            max="50"
            defaultValue={v.farmSizeHa}
            aria-invalid={!!err.farmSizeHa}
            className={inputClass}
          />
        </Field>
        <Field label="Cashew trees" error={err.numberOfTrees} hint="Optional">
          <input
            name="numberOfTrees"
            type="number"
            inputMode="numeric"
            min="1"
            defaultValue={v.numberOfTrees}
            aria-invalid={!!err.numberOfTrees}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Cooperative" error={err.cooperative} hint="Optional">
        <input name="cooperative" defaultValue={v.cooperative} className={inputClass} />
      </Field>

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer gap-3 rounded-xl border border-black/15 bg-white p-4 has-[:checked]:border-brand has-[:checked]:bg-brand-light/50">
          <input
            type="checkbox"
            name="consentGiven"
            defaultChecked={v.consentGiven === "on"}
            className="mt-0.5 size-6 shrink-0 accent-brand"
          />
          <span className="text-sm leading-snug">
            Farmer agrees that their lot data (initials, community, quality results) may be shown to buyers.
          </span>
        </label>
        {err.consentGiven && <span className="text-sm text-red-700">{err.consentGiven[0]}</span>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Registering…" : "Register farmer"}
      </button>
    </form>
  );
}
