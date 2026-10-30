"use client";

import { useActionState } from "react";
import { Field, FormError, Segmented, inputClass } from "@/components/ui/form";
import { createAgentAction, resetPinAction, type AgentFormState } from "./actions";

function Done({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand">
      {message}
    </p>
  );
}

export function NewAgentForm({ hubs }: { hubs: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AgentFormState, FormData>(createAgentAction, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  return (
    // Remount after a successful add so the fields clear.
    <form key={state.done} action={action} className="flex flex-col gap-4" noValidate>
      <Done message={state.done} />
      <FormError message={state.error} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={err.name}>
          <input name="name" autoComplete="off" defaultValue={v.name} aria-invalid={!!err.name} className={inputClass} />
        </Field>
        <Field label="Phone number" error={err.phone} hint="Used to sign in">
          <input name="phone" type="tel" inputMode="tel" defaultValue={v.phone} aria-invalid={!!err.phone} className={inputClass} />
        </Field>
      </div>
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
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/15 bg-white p-4 has-[:checked]:border-brand">
        <input type="checkbox" name="isYouth" defaultChecked={v.isYouth === "on"} className="size-6 accent-brand" />
        <span className="text-sm font-medium">Youth (under 35)</span>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hub" error={err.hubId}>
          <select name="hubId" defaultValue={v.hubId ?? ""} aria-invalid={!!err.hubId} className={inputClass}>
            <option value="" disabled>
              Choose a hub
            </option>
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Starting PIN" error={err.pin} hint="4–6 digits — tell the agent in person">
          <input name="pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} aria-invalid={!!err.pin} className={`${inputClass} tracking-[0.3em]`} />
        </Field>
      </div>
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60 sm:w-48">
        {pending ? "Adding…" : "Add agent"}
      </button>
    </form>
  );
}

export function ResetPinForm({ agentId, name }: { agentId: string; name: string }) {
  const [state, action, pending] = useActionState<AgentFormState, FormData>(resetPinAction, {});
  const err = state.fieldErrors ?? {};
  return (
    <form key={state.done} action={action} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="agentId" value={agentId} />
      <Done message={state.done} />
      <FormError message={state.error} />
      <div className="flex items-end gap-2">
        <Field label={`New PIN for ${name}`} error={err.pin}>
          <input name="pin" type="password" inputMode="numeric" autoComplete="new-password" maxLength={6} aria-invalid={!!err.pin} className={`${inputClass} tracking-[0.3em]`} />
        </Field>
        <button type="submit" disabled={pending} className="h-12 shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-cream disabled:opacity-60">
          {pending ? "Saving…" : "Reset PIN"}
        </button>
      </div>
    </form>
  );
}
