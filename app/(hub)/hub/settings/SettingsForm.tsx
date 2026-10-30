"use client";

import { useActionState, type ReactNode } from "react";
import { Field, FormError, inputClass } from "@/components/ui/form";
import { saveSettingsAction, type SettingsState } from "./actions";

type Defaults = Record<string, number>;

export function SettingsForm({ defaults }: { defaults: Defaults }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettingsAction, {});
  const v = state.values ?? {};
  const err = state.fieldErrors ?? {};

  const num = (name: string, label: string, opts: { step?: string; hint?: string; unit?: string } = {}) => (
    <Field label={opts.unit ? `${label} (${opts.unit})` : label} error={err[name]} hint={opts.hint}>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        step={opts.step ?? "any"}
        defaultValue={v[name] ?? String(defaults[name])}
        aria-invalid={!!err[name]}
        className={inputClass}
      />
    </Field>
  );

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <FormError message={state.error} />
      {state.saved && (
        <p role="status" className="rounded-xl bg-brand-light px-4 py-3 text-sm font-medium text-brand">
          Settings saved.
        </p>
      )}

      <Group title="Prices & fees" note="The price prefills new sales; fees apply to new sales.">
        {num("farmGatePricePerTonneNgn", "Farm-gate price", { unit: "₦ per tonne", step: "1000", hint: "Placeholder — update to the current market price" })}
        {num("commissionPct", "Buyer commission", { unit: "%", step: "0.1", hint: "Charged to buyers on completed sales" })}
        {num("dryingTestFeePerBagNgn", "Drying & testing fee", { unit: "₦ per bag", step: "50" })}
        {num("storageFeePerBagPerMonthNgn", "Storage fee", { unit: "₦ per bag per month", step: "50" })}
      </Group>

      <Group title="Grading thresholds" note="Configurable defaults, to be calibrated with buyers. Changes apply to new tests; existing grades are kept.">
        {num("moistureMaxPct", "Maximum moisture", { unit: "%", step: "0.1", hint: "Wetter lots must keep drying" })}
        {num("gradeA_minKor", "Grade A from", { unit: "lbs KOR", step: "0.5" })}
        {num("gradeB_minKor", "Grade B from", { unit: "lbs KOR", step: "0.5" })}
        {num("gradeC_minKor", "Grade C from", { unit: "lbs KOR", step: "0.5", hint: "Below this, a lot fails" })}
      </Group>

      <Group title="Impact estimates" note="Used for figures labelled “Estimated” on the dashboards.">
        {num("spoilageAvoidedPct", "Spoilage-avoided factor", { unit: "% of tonnes dried", step: "0.5", hint: "Assumption, not a measurement" })}
      </Group>

      <button
        type="submit"
        disabled={pending}
        className="h-14 rounded-xl bg-brand text-base font-semibold text-cream transition hover:bg-brand-dark disabled:opacity-60 sm:w-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Group({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-lg font-bold" aria-hidden="true">
        {title}
      </h2>
      <p className="mt-0.5 mb-4 text-sm text-ink/70">{note}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
