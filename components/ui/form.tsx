import type { ReactNode } from "react";

export const inputClass =
  "h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-base outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40 aria-invalid:border-red-600";

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink/70">{hint}</span>}
      {error && <span className="text-sm text-red-700">{error[0]}</span>}
    </label>
  );
}

/** Large two/three-way choice built from radio inputs (works without JS). */
export function Segmented({
  name,
  label,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  error?: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="grid grid-flow-col auto-cols-fr gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-black/15 bg-white px-2 text-center text-sm font-medium transition has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-cream has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30"
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={defaultValue === o.value}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <span className="text-sm text-red-700">{error[0]}</span>}
    </fieldset>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
      {message}
    </p>
  );
}
