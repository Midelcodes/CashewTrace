"use client";

import { useActionState } from "react";
import { Field, FormError, inputClass } from "@/components/ui/form";
import { submitInterestAction, type InterestState } from "./actions";

export function InterestForm({ lotCode, hubName, commissionPct }: { lotCode: string; hubName: string; commissionPct: number }) {
  const [state, action, pending] = useActionState<InterestState, FormData>(submitInterestAction, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  if (state.sent) {
    return (
      <div role="status" className="rounded-2xl bg-brand-light p-5 text-brand">
        <p className="text-lg font-bold">Thank you{state.contactName ? `, ${state.contactName.split(" ")[0]}` : ""}!</p>
        <p className="mt-1 text-sm text-ink/80">
          Your interest in lot <span className="font-mono">{lotCode}</span> has been sent to {hubName}. The hub team will
          contact you to arrange a sample, pricing and pickup.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="relative flex flex-col gap-4" noValidate>
      <input type="hidden" name="lotCode" value={lotCode} />
      {/* Honeypot: hidden from people and screen readers; bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" error={err.companyName}>
          <input name="companyName" autoComplete="organization" defaultValue={v.companyName} aria-invalid={!!err.companyName} className={inputClass} />
        </Field>
        <Field label="Contact name" error={err.contactName}>
          <input name="contactName" autoComplete="name" defaultValue={v.contactName} aria-invalid={!!err.contactName} className={inputClass} />
        </Field>
        <Field label="Email" error={err.email}>
          <input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} aria-invalid={!!err.email} className={inputClass} />
        </Field>
        <Field label="Phone" error={err.phone}>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} aria-invalid={!!err.phone} className={inputClass} />
        </Field>
      </div>
      <Field label="Message" error={err.message} hint="Optional — volume, delivery location, questions">
        <textarea
          name="message"
          rows={3}
          defaultValue={v.message}
          className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
        />
      </Field>
      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-xl bg-accent-dark text-base font-semibold text-white transition hover:bg-accent-darker disabled:opacity-60"
      >
        {pending ? "Sending…" : "Express interest in this lot"}
      </button>
      <p className="-mt-1 text-xs text-ink/70">
        Your details go only to the hub that holds this lot. CashewTrace charges buyers a {commissionPct}% commission on
        completed purchases.
      </p>
    </form>
  );
}
