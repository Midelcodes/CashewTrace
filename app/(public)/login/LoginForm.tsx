"use client";

import { useActionState } from "react";
import { FormError, inputClass } from "@/components/ui/form";
import type { FormState } from "@/lib/forms";
import { loginAction } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      <FormError message={state.error} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Phone number</span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0803 123 4567"
          defaultValue={state.values?.phone}
          required
          className={inputClass}
        />
        {state.fieldErrors?.phone && (
          <span className="text-sm text-red-700">{state.fieldErrors.phone[0]}</span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">PIN</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder="4–6 digits"
          required
          className={`${inputClass} tracking-[0.3em]`}
        />
        {state.fieldErrors?.pin && <span className="text-sm text-red-700">{state.fieldErrors.pin[0]}</span>}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-xl bg-brand text-base font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
